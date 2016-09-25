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

class ChatterGraph {
    scales() {
        const { width, height, keys } = this;
        if (!this.x) this.x = d3.scaleBand().rangeRound([ 0, width ]).padding(0.1);
        if (!this.y) this.y = d3.scaleLinear().rangeRound([ height, 0 ]);
        if (!this.p) this.p = d3.scaleLinear().rangeRound([ height, 0 ]).domain([0, 1]);
        if (!this.color) this.color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);
        return { x: this.x, y: this.y, p: this.p, color: this.color };
    }
    
    axes() {
        const { x, y, p } = this.scales();
        if (!this.xAxis) this.xAxis = d3.axisBottom(x);
        if (!this.yAxis) this.yAxis = d3.axisLeft(y);
        if (!this.pAxis) this.pAxis = d3.axisRight(p);
        return { xAxis: this.xAxis, yAxis: this.yAxis, pAxis: this.pAxis };
    }

    shapes() { 
        if (!this.stack) {
            const { keys } = this;
            this.stack = d3.stack()
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
        }

        if (!this.line) {
            const { x, p } = this.scales();
            this.line = d3.line()
                .x(d => x(d.name))
                .y(d => p(d.chatterInfluence.percentile));
        }

        return { stack: this.stack, line: this.line };
    }

    get elements() {
        return { svg: this.svg, xAx: this.xAx, xYx: this.xYx, xPx: this.xPx, lines: this.lines };
    }

    set elements(elements) {
        const { svg, xAx, xYx, xPx, lines } = elements;
        if (svg) this.svg = svg;
        if (xAx) this.xAx = xAx;
        if (xYx) this.xYx = xYx;
        if (xPx) this.xPx = xPx;
        if (lines) this.lines = lines;
    }

    accessors() {
        const { x } = this.scales();
        const { keys } = this;
        if (!this.xg_val) this.xg_val = (d, type) => type === 'stack' ? 0 : x.bandwidth() / keys.length * (d.index - 1);
        if (!this.x_val) this.x_val = (d, type) => type === 'stack' ? x(d.data.name) : x(d.data.name) + x.bandwidth() / keys.length;
        if (!this.y_val) this.y_val = (d, type) => type === 'stack' ? d[1] : d[1] - d[0];
        if (!this.w_val) this.w_val = (d, type) => type === 'stack' ? x.bandwidth() : x.bandwidth() / keys.length;
        if (!this.h_val) this.h_val = (d, type) => d[1] - d[0];
        return { xg_val: this.xg_val, x_val: this.x_val, y_val: this.y_val, w_val: this.w_val, h_val: this.h_val };
    }

    constructor(width, height) {
        this.margin = { top: 10, right: 40, bottom: 100, left: 40 };
        
        const { left, right, top, bottom } = this.margin;
        this.width = width - left - right;
        this.height = height - top - bottom;    
        
        this.keys = ['Comment Posted', 'Comment Received', "Post Count", "Followers", "Groups"];
        this.type = 'stack';
        this.data = null;
    }

    switchType() {
        this.type = this.type === 'stack' ? 'group' : 'stack';
        this.updateBars();
    }

    buildChart() {
        let { svg, xAx, xYx, xPx } = this.elements; 
        const { width, height, keys } = this;
        const { left, top, right, bottom } = this.margin;
        const { pAxis } = this.axes();
        const { color } = this.scales();
        svg = d3.select('body').append('svg')
            .attr('width', width + left + right)
            .attr('height', height + top + bottom)
          .append('g')
            .attr('transform', 'translate(' + left + ',' + top + ')');

        svg.on('click', () => { this.switchType() });
        
        xAx = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0, ' + height + ')');
    
        xYx = svg.append('g')
            .attr('class', 'y axis');

        xPx = svg.append('g')
            .attr('class', 'p axis')
            .attr('transform', 'translate(' + width + ', 0)');
    

        const legend = svg.append("g").selectAll(".legend")
            .data(keys)
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => { return "translate(0," + i * 20 + ")"; })
            .style("font", "10px sans-serif");

        legend.append("rect")
            .attr("x", width - 36)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d));

        legend.append("text")
            .attr("x", width - 40)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(d => d); 
        
        this.elements = { svg, xAx, xYx, xPx };
    }
    
    updateData(data) {
        data.sort((a, b) => +b.chatterInfluence.percentile - +a.chatterInfluence.percentile);
        
        //const minRank = d3.min(data, d => +d.chatterInfluence.percentile); 
        const minRank = 30;
        //this.data = data.filter(d => +d.chatterInfluence.percentile > minRank);
        this.data = data.filter(d => d.chatterInfluence.rank < minRank);
        
        const { x } = this.scales();
        x.domain(this.data.map(user => user.name));

        const { stack } = this.shapes();
        this.layerData = stack(this.data);
        
        this.updateBars();
        this.updateLines();
    }

    updateLines() {
        const { data } = this;
        const { x } = this.scales();
        const { line } = this.shapes();
        const { pAxis } = this.axes();
        let { svg, lines, xPx } = this.elements; 
        lines = svg.append("g")
            .attr("class", "line")
            .attr("transform", d => 'translate('+ x.bandwidth() / 2 + ',0)')
          .append("path")
            .datum(data)
            .attr("class", "p-line")
            .attr("d", d => line(d));
        
        xPx.call(pAxis);
        this.elements = { svg, lines, xPx };
    }

    updateBars() {
        const { layerData, type } = this;
        const { x, y, color } = this.scales();
        const { line } = this.shapes();
        const { xAxis, yAxis } = this.axes();
        const { xg_val, x_val, y_val, w_val, h_val } = this.accessors();
        const { svg, xAx, xYx } = this.elements;

        //update domains
        const yMax = d3.max(layerData, d => d3.max(d, e => y_val(e, type)));
        y.domain([ 0, yMax ]);
        
        //redraw axes
        xAx.call(xAxis)
            .selectAll('text')
            .attr('y', 0)
            .attr('x', -9)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(270)')
            .style('text-anchor', 'end');
        xYx.call(yAxis);

        //build/update rectangles
        const layers = svg.selectAll('.layer')
            .data(layerData)
          .enter().append('g')
            .attr('class', 'layer')
            .attr('transform', d => 'translate(' + xg_val(d, type) + ', 0)')
            .attr('fill', d => color(d.key));    

        svg.selectAll('.layer').transition()
            .delay((d, i) => i * 10)
            .attr('transform', d => 'translate(' + xg_val(d, type) + ', 0)' );

        layers.selectAll('.bar')
            .data(d => d)
          .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x_val(d, type))
            .attr('y', d => y(0))
            .attr('width', d => w_val(d, type))
            .attr('height', 0);

        svg.selectAll('.bar').transition()
            .delay((d, i) => i * 10)
            .attr('y', d => y(y_val(d, type)))
            .attr('width', d => w_val(d, type))
            .attr('x', d => x_val(d, type))
            .attr('height', d => y(0) - y(h_val(d, type)));
    }
}

