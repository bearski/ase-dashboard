queue()
  .defer(d3.json, "/api/scholar_khan_points")
  // .defer(d3.json, "khan_points.json")
  .await(makeGraphs);

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function makeGraphs(error, data) {

  khanDataTable = dc.dataTable('#khanDataTable');
  khanRowChart = dc.rowChart('#khanRowChart');

  // filteredRowChart = dc.rowChart('#grade-row-chart-filtered');


  var DTSformat = d3.time.format("%Y-%m-%d");


  // set up data
  data.forEach(function(d) {
    d.formattedDate = DTSformat.parse(d.activity_date.substr(0, 10));
    d.month = d3.time.month(d.formattedDate);
    // d.pointsPerDate = undefined || d.points_per_date;
  });

  // console.log(data);

  var ndx = crossfilter(data);

  var emailDimension = ndx.dimension(function(d) { return d.email; });

  var gradeDimension = ndx.dimension(function(d) { return d.grade; });
  // console.log(gradeDimension.top(10));



  //////  update to count unique students
  var gradeGroup = gradeDimension.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalPoints += +d.points_per_date;
      if(d.student_name in p.student_names){
          p.student_names[d.student_name] += 1
      }
      else{
          p.student_names[d.student_name] = 1;
          p.student_count++;
      }
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalPoints -= +d.points_per_date;
      p.student_names[d.student_name]--;
      if(p.student_names[d.student_name] === 0){
        delete p.student_names[d.student_name];
        p.student_count--;
      }
      return p;
    },
    function () {
      return {
        count: 0,
        totalPoints: 0,
        student_names: {},
        student_count: 0
      };
    });

  // console.log(gradeGroup.top(10));


  khanRowChart
    .width(400)
    .height(200)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroup)
    .valueAccessor(function(d) { return d.value.totalPoints; })
    .ordering(function(d) { return -d.value.totalPoints })
    .label(function(d) {
      return 'Total Points for Grade ' +
        d.key + ': ' +
        d.value.totalPoints + ' (' +
        d.value.student_count + ' students)';
    })
    .elasticX(true)
    .xAxis()
    .ticks(4);


  khanDataTable
    .width(400)
    .height(200)
    .dimension(emailDimension)
    .size(10)
    .group(function(d) { return ''; })
    .columns([
      // function(d) { return '    '; },
      function(d) { return d.student_name; },
      function(d) { return + d.points_per_date; },
      function(d) { return d.grade; }
    ])
    .sortBy(function(d) { return +d.points_per_date; })
    .order(d3.descending);

    //
    // var dateDim = ndx.dimension(
    //   function(x) {
    //     return x.month;
    //   }
    // );

    //
    // var dateDim = {
    //   grade: ndx.dimension(function(d) { return d.grade }),
    //   month: ndx.dimension(function(d) { return d.month }),
    //   id:  ndx.dimension(function(d) { return JSON.stringify([d.grade, d.month]); })
    // }

    // console.log(dateDim.grade.top(10));
    // console.log(dateDim.month.top(10));
    // console.log(dateDim.id.top(10));

    // var gradeMonthGroup = dateDim.id.group();
    // gradeMonthGroup.all().forEach(function(d) {
    //   d.key = JSON.parse(d.key);
    // });

    // var group = dateDim.id.group();
    //
    // group.all().forEach(
    //   function(d) {
    //     d.key = JSON.parse(d.key);
    //   }
    // );
    //
    // var sum = group.reduceSum(function(d) {return d.points_per_date;}).all();

    // console.log('sum');
    // console.log(sum);



    // var gradeMonthGroup = dateDim.id.group().reduce(
    //   function (p, d) {
    //     ++p.count;
    //     p.totalPoints += +d.points_per_date;
    //     return p;
    //   },
    //   function (p, d) {
    //     --p.count;
    //     p.totalPoints -= +d.points_per_date;
    //     return p;
    //   },
    //   function () {
    //     return {
    //       count: 0,
    //       totalPoints: 0,
    //     };
    //   });
    //
    // console.log('gradeMonthGroup');
    // console.log(gradeMonthGroup.top(10));


    //
    // function double_reduce(dim, groupf, firstf) {
    //   return {
    //     all: function() {
    //       var recs = dim.bottom(Infinity);
    //       var hit = {};
    //       var bins = {};
    //       recs.forEach(
    //         function(r) {
    //           console.log(monthf(r));
    //           var fkey = firstf(r);     // points
    //           var gkey = groupf(r);     // grade
    //           hit[fkey] = true;
    //           bins[gkey] = (bins[gkey] || 0) + fkey;
    //         }
    //       );
    //       return Object.keys(bins).map(function(k) {
    //         return {
    //           key: k,
    //           value: bins[k]
    //         };
    //       });
    //     }
    //   }
    // }
    //
    // var dubred_group = double_reduce(
    //   dateDim,
    //   function(r) {
    //     return r.grade;
    //   },
    //   function(r) {
    //     return r.points;
    //   }
    //   ,
    //   function(r) {
    //     return r.month;
    //   }
    // );
    // console.log(dubred_group.all());

    //d3.select('#output1').text(JSON.stringify(dubred_group.all(), null, 2));
    //dateDim.filter([new Date("2017-01-01"), new Date("2017-01-31")]);
    //d3.select('#output2').text(JSON.stringify(dubred_group.all(), null, 2));


    // filteredRowChart
    //   .width(800)
    //   .height(200)
    //   .margins({
    //     top: 20,
    //     left: 10,
    //     right: 10,
    //     bottom: 20
    //   })
    //   .dimension(dateDim)
    //   .group(group)
    // //   .valueAccessor(
    // //     function(d) {
    // //       return d.value.totalPoints;
    // //     })
    // //  .ordinalColors(['#90C3D4', '#21A1CC', '#72C1DB', '#05BBF7', '#0785F2'])
    // //  .label(function(d) {
    // //        return 'Total Points for Grade ' + d.key + ': ' + d.value;
    // //      })
    // //   .title(function(d) { return d.value; })
    //   .elasticX(true)
    //   .xAxis()
    //   .ticks(4);


  dc.renderAll();


  // var timeDimension = ndx.dimension(function(d) { return d.formattedDate; });
  // console.log(timeDimension.top(10));
  //
  // var btns = d3.select(".buttons-container").selectAll("button").data(["3", "2", "Last Month", "Last Week", "This Year", "This Month"])
  //
  // btns = btns.enter().append("button").attr("class", "btn btn-sm btn-success")
  //
  // // fill the buttons with the year from the data assigned to them
  // btns.each(function(d) {
  //     this.innerText = d;
  // })
  //
  // btns.on("click", drawBrush);
  //
  // function drawBrush() {
  //   // our year will this.innerText
  //   if (this.innerText === "This Year") {
  //     thisYear();
  //   }
  //   if (this.innerText === "This Month") {
  //     thisMonth();
  //   }
  //   if (this.innerText === "Last Week") {
  //     lastWeek();
  //   }
  //   if (this.innerText === "Last Month") {
  //     lastMonth();
  //   }
  //   if (this.innerText === "2") {
  //     twoMonths();
  //   }
  //   if (this.innerText === "3") {
  //     threeMonths();
  //   }
    //
    // var st = $('div#start').text();
    // var end = $('div#end').text();
    //
    // console.log(st);
    // console.log(end);

    /*
    // define our brush extent to be begin and end of the year
    //brush.extent([new Date(this.innerText + '2015-01-01'), new Date(this.innerText + '2015-12-31')])
    brush.extent([new Date(st), new Date(end)])

    // now draw the brush to match our extent
    // use transition to slow it down so we can see what is happening
    // remove transition so just d3.select(".brush") to just draw
    brush(khanRowChart.select(".brush").transition().delay(1000));

    // now fire the brushstart, brushmove, and brushend events
    // remove transition so just d3.select(".brush") to just draw
    //d3.select(".brush").transition().delay(1000);
    //$(".brush").transition().delay(1000);
    // khanRowChart.brush.event(khanRowChart.select(".brush").transition().delay(1000))

    dataFiltered = data.filter(function(d, i) {
        var mon2 = d.dtg1;
        if ( (mon2 >= st) && (mon2 <= end) ) {
            return d.dtg;
        }
    });
    //brush.event(khanRowChart.select(".brush").transition().delay(1000))
    //dateFiltered = ndx.dimension(function (d) { return d.dtg; });
    */

    // filteredRowChart.filter(null);
    // filteredRowChart.filter(dc.filters.RangedFilter(new Date(st), new Date(end)));

  	// dateDim.filter([new Date(st), new Date(end)]);
	  // d3.select('#output2').text(JSON.stringify(dubred_group.all(), null, 2));



    // console.log('redrawAll with date filter');


    // dc.redrawAll();
    //rtey = brush.extent();
    //dc.renderAll();
  // }

  function fixed_now() {
    var today = new Date();
    var y = today.getFullYear();
    var m = today.getMonth() + 1;
    var d = today.getDate();
    var ymd = y + "-" + m + "-" + d;
    return Date(ymd);
      // return new Date("2015-04-15")
  }

  function thisWeek() {
      var now = moment(fixed_now());
      var mon = now.startOf('week').add('days', 1);
      var startMoment = mon.format("YYYY-MM-DD");
      var endMoment = mon.add('days', 6).format("YYYY-MM-DD");
      $("#start").text(startMoment);
      $("#end").text(endMoment);
  }

  function thisMonth() {
      var firstOfMonth = moment(fixed_now(), 'YYYY-MM-DD').startOf("month");
      var endOfMonth = moment(fixed_now(), 'YYYY-MM-DD').endOf("month");
      var startMoment = firstOfMonth.format("YYYY-MM-DD");
      var endMoment = endOfMonth.format("YYYY-MM-DD");
      $("#start").text(firstOfMonth);
      $("#end").text(endOfMonth);
  }

  function thisYear() {
    var firstOfYear = moment(fixed_now(), 'YYYY-MM-DD').startOf("year");
    var endOfMonth = moment(fixed_now(), 'YYYY-MM-DD').endOf("month");
    var startMoment = firstOfYear.format("YYYY-MM-DD");
    var endMoment = endOfMonth.format("YYYY-MM-DD");
    $("#start").text(startMoment);
    $("#end").text(endMoment);
  }

  function lastWeek() {
      var now = moment(fixed_now());
      var mon = now.startOf('week').subtract('days', 6)
      var startMoment = mon.format("YYYY-MM-DD");
      var endMoment = mon.add('days', 6).format("YYYY-MM-DD");
      $("#start").text(startMoment);
      $("#end").text(endMoment);
  }

  function lastMonth() {
      var firstOfMonth = moment(fixed_now()).startOf("month").subtract('months', 1);
      var endOfMonth = moment(fixed_now()).endOf("month").subtract('months', 1);
      var startMoment = firstOfMonth.format("YYYY-MM-DD");
      var endMoment = endOfMonth.format("YYYY-MM-DD");
      $("div#start").text(startMoment);
      $("div#end").text(endMoment);
  }

  function twoMonths() {
      var firstOfMonth = moment(fixed_now()).startOf("month").subtract('months', 2);
      var endOfMonth = moment(fixed_now()).endOf("month").subtract('months', 2);
      var startMoment = firstOfMonth.format("YYYY-MM-DD");
      var endMoment = endOfMonth.format("YYYY-MM-DD");
      $("#start").text(startMoment);
      $("#end").text(endMoment);
  }

  function threeMonths() {
      var firstOfMonth = moment(fixed_now()).startOf("month").subtract('months', 3);
      var endOfMonth = moment(fixed_now()).endOf("month").subtract('months', 3);
      var startMoment = firstOfMonth.format("YYYY-MM-DD");
      var endMoment = endOfMonth.format("YYYY-MM-DD");
      $("#start").text(startMoment);
      $("#end").text(endMoment);
  }

  // function brushed() {
  //   console.log('brushed')
  //   khanRowChart.x.domain(brush.empty() ? khanRowChart.x.domain() : brush.extent());
  //     //focus.select("khanRowChart.area").attr("d", area);
  //     //focus.select("khanRowChart.x.axis").call(xAxis);
  // }


  dc.renderAll();

}
