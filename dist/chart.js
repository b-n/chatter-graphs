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
        
    set stack({ keys, fitType }) {
        if (!this.shapes.stack) this.shapes.stack = d3.stack()
            .value((d, key) => {
                switch(key) {
                    case 'Comments Posted': 
                        return d.chatterActivity.commentCount;
                    case 'Comments Received':
                        return d.chatterActivity.commentReceivedCount;
                    case 'Posts':
                        return d.chatterActivity.postCount;
                    case 'Followers':
                        return d.followersCount;
                    case 'Groups':
                        return d.groupCount;
                    default:
                        return;
                }
            });

        const fit = fitType === 'standard' ? d3.stackOffsetNone : d3.stackOffsetExpand;
        this.shapes.stack.keys(keys).offset(fit);
    }

    get stack() {
        return this.shapes.stack
    }

    shapes() { 
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
        const { keys, displayType } = this;
        this.w_val = d => displayType === 'stacked' ? x.bandwidth() : x.bandwidth() / keys.length;
        this.x_val = d => displayType === 'stacked' ? x(d.data.name) : x(d.data.name) + x.bandwidth() / keys.length * d.index;
        this.y_val = d => displayType === 'stacked' ? d.d1 : d.d1 - d.d0;
        this.w_val = d => displayType === 'stacked' ? x.bandwidth() : x.bandwidth() / keys.length;
        this.h_val = d => d.d1 - d.d0;
        return { x_val: this.x_val, y_val: this.y_val, w_val: this.w_val, h_val: this.h_val };
    }

    constructor(elementSelector, width, height, options) {
        this.margin = { top: 10, right: 150, bottom: 100, left: 40 };
        const { left, right, top, bottom } = this.margin;
        this.width = width - left - right;
        this.height = height - top - bottom;    
        
        this.elementSelector = elementSelector;
        
        this.options = options;
        this.data = null;
    }

    set options(opt) {
        this.minRank = opt && opt.minRank ? opt.minRank : 330;
        this.keys = opt && opt.keys ? opt.keys : ['Comments Posted', 'Comments Received', "Posts", "Followers", "Groups"];
        this.displayType = opt && opt.displayType ? opt.displayType : 'grouped';
        this.fitType = opt && opt.fitType ? opt.fitType : 'standard';
        this.stack = { keys: this.keys, fitType: this.fitType };
    }

    buildChart() {
        let { svg, xAx, xYx, xPx } = this.elements; 
        const { width, height, keys, elementSelector } = this;
        const { left, top, right, bottom } = this.margin;
        const { pAxis } = this.axes();
        const { color } = this.scales();

        svg = d3.select(elementSelector).append('svg')
            .attr('width', width + left + right)
            .attr('height', height + top + bottom)
          .append('g')
            .attr('transform', 'translate(' + left + ',' + top + ')');

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
            .attr("x", width + 30)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d));

        legend.append("text")
            .attr("x", width + 57)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .text(d => d); 
        
        this.elements = { svg, xAx, xYx, xPx };
    }

    updateData(data) {
        this.rawData = data;
    }

    calculateChartData() {
         
        const { minRank } = this;
        const filteredData = this.rawData.filter(d => d.chatterInfluence.rank < minRank);
        this.data = filteredData.sort((a, b) => +b.chatterInfluence.percentile - +a.chatterInfluence.percentile);
        
        const { x } = this.scales();
        x.domain(this.data.map(user => user.name));

        const { stack } = this.shapes();
        const layerData = stack(this.data);

        this.layerData = layerData.reduce((prev, current) => {
            const newValues = current.map(item => ({ key: current.key, index: current.index, d0: item[0], d1: item[1], data: item.data}));
            return prev.concat(newValues);
        }, []);
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
        const { layerData, displayType } = this;
        const { x, y, color } = this.scales();
        const { line } = this.shapes();
        const { xAxis, yAxis } = this.axes();
        const { xg_val, x_val, y_val, w_val, h_val } = this.accessors();
        const { svg, xAx, xYx } = this.elements;

        //update domains
        const yMax = d3.max(layerData, d => y_val(d, displayType));
        y.domain([ 0, yMax ]);
        
        //redraw axes
        xAx.transition().call(xAxis)
            .selectAll('text')
            .attr('y', 0)
            .attr('x', -9)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(270)')
            .style('text-anchor', 'end');
        xYx.transition().call(yAxis);

        //create and update bars
        const bars = svg.selectAll('.bar')
            .data(layerData, d => d.data.name + '-' + d.key + '-' + d.index);
        
        bars.exit()
            .transition()
            .delay((d, i) => i * 10)
            .attr('height', 0)
            .attr('y', d => y(y_val(d) + y(0) - y(h_val(d))))
            .remove();
        
        bars.enter().append('rect')
            .attr('class', 'bar')
            .attr('x', x_val)
            .attr('y', y(0))
            .attr('width', w_val)
            .attr('fill', d => color(d.key))
            .attr('height', 0)
          .transition()
            .delay((d, i) => i * 10)
            .attr('y', d => y(y_val(d)))
            .attr('height', d => y(0) - y(h_val(d)));

        bars.transition()
            .delay((d, i) => i * 10)
            .attr('x', x_val)
            .attr('y', d => y(y_val(d)))
            .attr('height', d => y(0) - y(h_val(d)))
            .attr('width', w_val)
    }
}

