<template>
  <div id="app">
    <header class="am-topbar am-topbar-fixed-top">
      <h1 class="am-topbar-brand">
        <a href="#" class="am-text-ir">Power by Vue</a>
      </h1>
    </header>

    <div class="am-container">
      <div id="box" class="am-text-center"></div>
      <div class="am-g" v-for="bullet in recentBullets">
        <div class="am-u-sm-2 am-text-right">
          <span class="am-badge am-round">{{ bullet.id }}</span>
        </div>
        <div class="am-u-sm-8 am-u-end">
          <bullet :key="bullet.id" :bars="bullet.bars"></bullet>
        </div>
      </div>
      <div class="am-g am-text-center">
        <span :class="recentStyle" @click="showMore"></span>
      </div>
    </div>

    <footer class="am-footer am-footer-default">
      <div class="am-footer-miscs ">
        <div>Copyright &copy; 2017 <a href="http://aiditan.me" target="_blank">Aidi Stan</a>, All Rights Reserved.</div>
      </div>
    </footer>

    <div class="am-modal am-modal-prompt" tabindex="-1" id="modal">
      <div class="am-modal-dialog">
        <div class="am-modal-hd">建立连接</div>
        <div class="am-modal-bd">
          请输入后端地址（如<code>localhost:3000</code>）
          <input type="text" class="am-modal-prompt-input">
        </div>
        <div class="am-modal-footer">
          <span class="am-modal-btn" data-am-modal-cancel>取消</span>
          <span class="am-modal-btn" data-am-modal-confirm>确认</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import * as d3 from 'd3'
import Bullet from './components/Bullet'

export default {
  name: 'app',
  data () {
    return {
      recent: 10,
      bullets: [],
      boxPlot: undefined
    }
  },
  computed: {
    recentStyle () { return `am-icon-md am-icon-angle-${this.recent < 100 ? 'down' : 'up'}` },
    recentBullets () { return _.take(this.bullets, this.recent) }
  },
  created () {
    this.initD3()
  },
  mounted () {
    this.showModal()
  },
  methods: {
    initD3 () {
      d3.box = function () {
        let width = 1
        let height = 1
        let duration = 0
        let domain = null
        let value = Number
        let whiskers = boxWhiskers
        let quartiles = boxQuartiles
        let tickFormat = null

        // For each small multiple…
        function box (g) {
          g.each(function (d, i) {
            d = d.map(value).sort(d3.ascending)
            let g = d3.select(this)
            let n = d.length
            let min = d[0]
            let max = d[n - 1]

            // Compute quartiles. Must return exactly 3 elements.
            let quartileData = d.quartiles = quartiles(d)

            // Compute whiskers. Must return exactly 2 elements, or null.
            let whiskerIndices = whiskers && whiskers.call(this, d, i)
            let whiskerData = whiskerIndices && whiskerIndices.map(function (i) { return d[i] })

            // Compute outliers. If no whiskers are specified, all data are "outliers".
            // We compute the outliers as indices, so that we can join across transitions!
            let outlierIndices = whiskerIndices
            ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
            : d3.range(n)

            // Compute the new x-scale.
            let x1 = d3.scaleLinear()
              .domain(domain && domain.call(this, d, i) || [min, max])
              .range([height, 0])

            // Retrieve the old x-scale, if this is an update.
            let x0 = this.__chart__ || d3.scaleLinear()
              .domain([0, Infinity])
              .range(x1.range())

            // Stash the new scale.
            this.__chart__ = x1

            // Note: the box, median, and box tick elements are fixed in number,
            // so we only have to handle enter and update. In contrast, the outliers
            // and other elements are variable, so we need to exit them! Variable
            // elements also fade in and out.

            // Update center line: the vertical line spanning the whiskers.
            let center = g.selectAll('line.center')
              .data(whiskerData ? [whiskerData] : [])

            center.enter().insert('line', 'rect')
              .attr('class', 'center')
              .attr('x1', width / 2)
              .attr('y1', function (d) { return x0(d[0]) })
              .attr('x2', width / 2)
              .attr('y2', function (d) { return x0(d[1]) })
              .style('opacity', 1e-6)
            .transition()
              .duration(duration)
              .style('opacity', 1)
              .attr('y1', function (d) { return x1(d[0]) })
              .attr('y2', function (d) { return x1(d[1]) })

            center.transition()
              .duration(duration)
              .style('opacity', 1)
              .attr('y1', function (d) { return x1(d[0]) })
              .attr('y2', function (d) { return x1(d[1]) })

            center.exit().transition()
              .duration(duration)
              .style('opacity', 1e-6)
              .attr('y1', function (d) { return x1(d[0]) })
              .attr('y2', function (d) { return x1(d[1]) })
              .remove()

            // Update innerquartile box.
            let box = g.selectAll('rect.box')
              .data([quartileData])

            box.enter().append('rect')
              .attr('class', 'box')
              .attr('x', 0)
              .attr('y', function (d) { return x0(d[2]) })
              .attr('width', width)
              .attr('height', function (d) { return x0(d[0]) - x0(d[2]) })
            .transition()
              .duration(duration)
              .attr('y', function (d) { return x1(d[2]) })
              .attr('height', function (d) { return x1(d[0]) - x1(d[2]) })

            box.transition()
              .duration(duration)
              .attr('y', function (d) { return x1(d[2]) })
              .attr('height', function (d) { return x1(d[0]) - x1(d[2]) })

            // Update median line.
            let medianLine = g.selectAll('line.median')
              .data([quartileData[1]])

            medianLine.enter().append('line')
              .attr('class', 'median')
              .attr('x1', 0)
              .attr('y1', x0)
              .attr('x2', width)
              .attr('y2', x0)
            .transition()
              .duration(duration)
              .attr('y1', x1)
              .attr('y2', x1)

            medianLine.transition()
              .duration(duration)
              .attr('y1', x1)
              .attr('y2', x1)

            // Update whiskers.
            let whisker = g.selectAll('line.whisker')
              .data(whiskerData || [])

            whisker.enter().insert('line', 'circle, text')
              .attr('class', 'whisker')
              .attr('x1', 0)
              .attr('y1', x0)
              .attr('x2', width)
              .attr('y2', x0)
              .style('opacity', 1e-6)
            .transition()
              .duration(duration)
              .attr('y1', x1)
              .attr('y2', x1)
              .style('opacity', 1)

            whisker.transition()
              .duration(duration)
              .attr('y1', x1)
              .attr('y2', x1)
              .style('opacity', 1)

            whisker.exit().transition()
              .duration(duration)
              .attr('y1', x1)
              .attr('y2', x1)
              .style('opacity', 1e-6)
              .remove()

            // Update outliers.
            let outlier = g.selectAll('circle.outlier')
              .data(outlierIndices, Number)

            outlier.enter().insert('circle', 'text')
              .attr('class', 'outlier')
              .attr('r', 5)
              .attr('cx', width / 2)
              .attr('cy', function (i) { return x0(d[i]) })
              .style('opacity', 1e-6)
            .transition()
              .duration(duration)
              .attr('cy', function (i) { return x1(d[i]) })
              .style('opacity', 1)

            outlier.transition()
              .duration(duration)
              .attr('cy', function (i) { return x1(d[i]) })
              .style('opacity', 1)

            outlier.exit().transition()
              .duration(duration)
              .attr('cy', function (i) { return x1(d[i]) })
              .style('opacity', 1e-6)
              .remove()

            // Compute the tick format.
            let format = tickFormat || x1.tickFormat(8)

            // Update box ticks.
            let boxTick = g.selectAll('text.box')
              .data(quartileData)

            boxTick.enter().append('text')
              .attr('class', 'box')
              .attr('dy', '.3em')
              .attr('dx', function (d, i) { return i & 1 ? 6 : -6 })
              .attr('x', function (d, i) { return i & 1 ? width : 0 })
              .attr('y', x0)
              .attr('text-anchor', function (d, i) { return i & 1 ? 'start' : 'end' })
              .text(format)
            .transition()
              .duration(duration)
              .attr('y', x1)

            boxTick.transition()
              .duration(duration)
              .text(format)
              .attr('y', x1)

            // Update whisker ticks. These are handled separately from the box
            // ticks because they may or may not exist, and we want don't want
            // to join box ticks pre-transition with whisker ticks post-.
            let whiskerTick = g.selectAll('text.whisker')
              .data(whiskerData || [])

            whiskerTick.enter().append('text')
              .attr('class', 'whisker')
              .attr('dy', '.3em')
              .attr('dx', 6)
              .attr('x', width)
              .attr('y', x0)
              .text(format)
              .style('opacity', 1e-6)
            .transition()
              .duration(duration)
              .attr('y', x1)
              .style('opacity', 1)

            whiskerTick.transition()
              .duration(duration)
              .text(format)
              .attr('y', x1)
              .style('opacity', 1)

            whiskerTick.exit().transition()
              .duration(duration)
              .attr('y', x1)
              .style('opacity', 1e-6)
              .remove()
          })
          d3.timerFlush()
        }

        box.width = function (x) {
          if (!arguments.length) return width
          width = x
          return box
        }

        box.height = function (x) {
          if (!arguments.length) return height
          height = x
          return box
        }

        box.tickFormat = function (x) {
          if (!arguments.length) return tickFormat
          tickFormat = x
          return box
        }

        box.duration = function (x) {
          if (!arguments.length) return duration
          duration = x
          return box
        }

        box.domain = function (x) {
          if (!arguments.length) return domain
          domain = x == null ? x : () => x
          return box
        }

        box.value = function (x) {
          if (!arguments.length) return value
          value = x
          return box
        }

        box.whiskers = function (x) {
          if (!arguments.length) return whiskers
          whiskers = x
          return box
        }

        box.quartiles = function (x) {
          if (!arguments.length) return quartiles
          quartiles = x
          return box
        }

        return box
      }

      function boxWhiskers (d) {
        return [0, d.length - 1]
      }

      function boxQuartiles (d) {
        return [
          d3.quantile(d, 0.25),
          d3.quantile(d, 0.5),
          d3.quantile(d, 0.75)
        ]
      }
    },
    plotBox () {
      let margin = {top: 10, right: 50, bottom: 20, left: 50}
      let width = 120 - margin.left - margin.right
      let height = 250 - margin.top - margin.bottom

      let min = Infinity
      let max = -Infinity

      let data = []

      this.boxPlot = this.boxPlot || d3.box()
        .whiskers(iqr(1.5))
        .width(width)
        .height(height)

      this.bullets.forEach((bullet) => {
        for (let k in bullet.bars) {
          let v = bullet.bars[k]

          if (data[k]) {
            data[k].push(v)
          } else {
            data[k] = [v]
          }

          if (v > max) max = v
          if (v < min) min = v
        }
      })

      this.boxPlot.domain([min, max])

      d3.select('#box').selectAll('svg')
        .data(_.values(data))
      .enter().append('svg')
        .attr('class', (d, i) => `box box-${i % 4}`)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.bottom + margin.top)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      d3.select('#box').selectAll('g')
        .data(_.values(data))
        .call(this.boxPlot.duration(300))

      // Returns a function to compute the interquartile range.
      function iqr (k) {
        return function (d, i) {
          let q1 = d.quartiles[0]
          let q3 = d.quartiles[2]
          let iqr = (q3 - q1) * k
          i = -1
          let j = d.length
          while (d[++i] < q1 - iqr);
          while (d[--j] > q3 + iqr);
          return [i, j]
        }
      }
    },
    showModal () {
      global.$('#modal').modal({
        relatedTarget: this,
        closeViaDimmer: false,
        onConfirm: (e) => {
          global.io(e.data || 'localhost:3000').on('bullet', (bars) => {
            this.bullets.unshift({
              id: this.bullets.length + 1,
              bars: bars
            })
            this.plotBox()
          })
        },
        onCancel: (e) => {
          setInterval(() => {
            this.bullets.unshift({
              id: this.bullets.length + 1,
              bars: {
                Callback: 0,
                Backend: 0,
                Frontend: 100 + 100 * Math.random()
              }
            })
            this.plotBox()
          }, 500)
        }
      })
    },
    showMore () {
      this.recent = this.recent < 100 ? 100 : 10
    }
  },
  components: {
    Bullet
  }
}
</script>

<style>
.am-with-topbar-fixed-top {
  padding-top: 60px
}

.am-topbar .am-text-ir {
  display: block;
  height: 50px;
  width: 36px;
  background: url('./assets/logo.png') no-repeat left center;
  background-size: 36px 36px;
}

.box {
  font: 10px sans-serif;
}

.box line,
.box rect,
.box circle {
  fill: #fff;
  stroke: #000;
  stroke-width: 1.5px;
}

.box .center {
  stroke-dasharray: 3,3;
}

.box .outlier {
  fill: none;
  stroke: #ccc;
}

.box.box-0 line, .box.box-0 rect, .box.box-0 circle { fill: #0e90d2 }
.box.box-1 line, .box.box-1 rect, .box.box-1 circle { fill: #5eb95e }
.box.box-2 line, .box.box-2 rect, .box.box-2 circle { fill: #F37B1D }
.box.box-3 line, .box.box-3 rect, .box.box-3 circle { fill: #dd514c }
</style>
