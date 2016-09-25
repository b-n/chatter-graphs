//let stack = d3.layout.stack();
//{
//  "chatterActivity":{
//    "commentCount":0,
//    "commentReceivedCount":0,
//    "likeReceivedCount":0,
//    "postCount":0
//  },
//  "chatterInfluence":{
//    "percentile":"0.0",
//    "rank":330
//  },
//  "name":"Aarno Korpela",
//  "email":"aarno.korpela@fronde.com",
//  "username":"aarno.korpela@fronde.com",
//  "followersCount":0,
//  "groupCount":6,
//  "managerName":"xWendell Holmes",
//  "title":"Senior Linux Engineer"
//}



const margin = { top: 10, right: 40, bottom: 100, left: 40 };
const width = 1000 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

const x = d3.scaleBand().rangeRound([ 0, width ]).padding(0.1);
const y = d3.scaleLinear().rangeRound([ height, 0 ]);
const p = d3.scaleLinear().rangeRound([ height, 0 ]).domain([0, 1]);

const keys = ['Comment Posted', 'Comment Received', "Post Count", "Followers", "Groups"];

const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(keys);

const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y);
const pAxis = d3.axisRight(p);

const stack = d3.stack()
    .keys(keys)
    .value((d, key) => {
        switch(key) {
            case 'Comment Posted': 
                return d.chatterActivity.commentCount;
            case 'Comment Received':
                return d.chatterActivity.commentReceivedCount;
            case 'Post Count':
                return d.chatterActivity.postCount;
            case 'Followers':
                return d.followersCount;
            case 'Groups':
                return d.groupCount;
            default:
                return;
        }
    });

let svg;
let xAx, xYx, xPx;

const buildChart = () => {
    svg = d3.select('body').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
        .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.on('click', function() {
        updateChart(chartType === 'stack' ? 'group' : 'stack');
    });

    xAx = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + height + ')');
    
    xYx = svg.append('g')
            .attr('class', 'y axis');
        
    xPx = svg.append('g')
            .attr('class', 'p axis')
            .attr('transform', 'translate(' + width + ', 0)')
            .call(pAxis);
}

const xg_val = (d, type) => type === 'stack' ? 0 : x.bandwidth() / keys.length * (d.index - 1);
const x_val = (d, type) => type === 'stack' ? x(d.data.name) : x(d.data.name) + x.bandwidth() / keys.length;
const y_val = (d, type) => type === 'stack' ? d[1] : d[1] - d[0];
const w_val = (d, type) => type === 'stack' ? x.bandwidth() : x.bandwidth() / keys.length;
const h_val = (d, type) => d[1] - d[0];

const p_line = d3.line()
    .x(d => x(d.name))
    .y(d => p(d.chatterInfluence.percentile));

let gData;

const updateData = (data) => {
    data.sort((a, b) => +b.chatterInfluence.percentile - +a.chatterInfluence.percentile);
    const minRank = d3.min(data, d => +d.chatterInfluence.percentile); 
    gData = data.filter(d => +d.chatterInfluence.percentile !== minRank);
    updateChart('stack');
}

let chartType;
let lines;

const updateChart = (ctype) => {
    chartType = ctype;
    const layerData = stack(gData);
    x.domain(gData.map(user => user.name));
    
    const yMax = d3.max(layerData, d => d3.max(d, e => y_val(e, ctype)));
    y.domain([ 0, yMax ]);
    xAx.call(xAxis)
        .selectAll('text')
            .attr('y', 0)
            .attr('x', -9)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(270)')
            .style('text-anchor', 'end');

    xYx.call(yAxis);

    const layers = svg.selectAll('.layer')
            .data(layerData)
        .enter()
            .append('g')
            .attr('class', 'layer')
            .attr('transform', d => 'translate(' + xg_val(d, ctype) + ', 0)')
            .attr('fill', d => color(d.key));    

    svg.selectAll('.layer').transition()
        .delay((d, i) => i * 10)
            .attr('transform', d => 'translate(' + xg_val(d, ctype) + ', 0)' );

    layers.selectAll('rect')
            .data(d => d)
        .enter().append('rect')
            .attr('x', d => x_val(d, ctype))
            .attr('y', d => y(0))
            .attr('width', d => w_val(d, ctype))
            .attr('height', 0);
    
    svg.selectAll('rect').transition()
        .delay((d, i) => i * 10)
            .attr('y', d => y(y_val(d, ctype)))
            .attr('width', d => w_val(d, ctype))
            .attr('x', d => x_val(d, ctype))
            .attr('height', d => y(0) - y(h_val(d, ctype)));

    if (!lines) {
        lines = svg.append("g")
                .attr("class", "line")
                .attr("transform", d => 'translate('+ x.bandwidth() / 2 + ',0)')
            .append("path")
                .datum(gData)
                .attr("class", "p-line")
                .attr("d", d => p_line(d));
    }
}
