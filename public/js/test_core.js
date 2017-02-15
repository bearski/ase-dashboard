'use strict';
/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

//

var monthBarChart = dc.barChart('#month-bar-chart');
var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
// var gradeBarChart = dc.barChart('#grade-bar-chart');
var khanDataTable = dc.dataTable('.khan-data-table');
var gradeRowChart = dc.rowChart('#grade-row-chart');
var yearPieChart = dc.pieChart("#year-pie-chart");


d3.json('/api/scholar_khan_points', function (data) {

  // Various formatters
  // var dateFormat = d3.time.format('%Y-%m-%d');
  var dateFormat = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");
  var dayNameFormat = d3.time.format("%A");
  var monthNumberFormat = d3.time.format('%m');
  var monthNameFormat = d3.time.format('%b');
  var numberFormat = d3.format('.1f');
  var weekDayFormat = d3.time.format('%w');  //weekday as a decimal number [0(Sunday),6].
  var yearFormat = d3.time.format('%Y');

  // Data from a csv file requires formatting
  data.forEach(function (d, i) {
    d.index = i;
    // d.date = dateFormat.parse(d.activity_date.substr(0, 10));
    d.date = dateFormat.parse(d.activity_date);
    d.month = d3.time.month(d.date); // pre-calculate month for performance
    });

  // console.log(data[0]);


  // function getDateDelta(origin, delta) {
  //   var x = new Date();
  //   x.setDate(origin.getDate() + delta);
  //   return x;
  // }
  //
  // var minDate = d3.min(data, function(d) { return d.date; });
  // var maxDate = d3.max(data, function(d) { return d.date; });
  // var sevenDaysAgo = getDateDelta(maxDate, -7);
  //
  // var totalEvents =  data.length;

  /* * * * * * * * * * * *
   * Crossfilter
   */

  //  set up reduce average functions
  function reduceAdd(p, d) {
    ++p.count;
    p.totalPoints += +d.points_per_date;
    if (d.student_name in p.studentNames) {
      p.studentNames[d.student_name] += 1
    } else {
      p.studentNames[d.student_name] = 1;
      p.studentCount++;
    }
    p.averagePoints = (p.totalPoints/p.studentCount);
    return p;
  }

  function reduceRemove(p, d) {
    --p.count;
    p.totalPoints -= +d.points_per_date;
    // p.averagePoints = (p.totalPoints/p.count);
    if (p.studentNames[d.student_name] === 0) {
      delete p.studentNames[d.student_name];
      p.studentCount--;
    }
    p.averagePoints = (p.totalPoints/p.studentCount);
    return p;
  }

  function reduceInitial() {
    return {
      count: 0,
      totalPoints: 0,
      averagePoints: 0,
      studentNames: {},
      studentCount: 0
    };
  }


  // use crossfilter to make dimensions and groups
  var ndx = crossfilter(data);
  var all = ndx.groupAll();

  // dimensions
  var dayOfWeekDimension = ndx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var gradeDimension = ndx.dimension(function (d) {
    return  d.grade;
  });

  var monthDimension = ndx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var studentDimension = ndx.dimension(function(d) {
    return d.student_name;
  });

  var yearDimension = ndx.dimension(function (d) {
    return yearFormat(d.date);
  });

  // groups
  var dayOfWeekGroup = dayOfWeekDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var gradeGroup = gradeDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var monthGroup = monthDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var studentGroup = studentDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var yearGroup = yearDimension.group(); //.reduce(reduceAdd, reduceRemove, reduceInitial);

  //
  var monthMax = +monthGroup.top(1)[0].value.averagePoints + 1000;
  // console.log(monthMax)


  // function remove_empty_bins(source_group) {
  //     function non_zero_pred(d) {
  //         return (d.value.averagePoints || 0) != 0;
  //     }
  //     return {
  //         all: function () {
  //             return source_group.all().filter(non_zero_pred);
  //         },
  //         top: function(n) {
  //             return source_group.top(Infinity)
  //                 .filter(non_zero_pred)
  //                 .slice(0, n);
  //         }
  //     };
  // }
  //
  // var filteredstudentGroup = remove_empty_bins(studentGroup);

  // console.log(studentGroup.top(Infinity));

  // var fakeStudentDimension = {
  //   top: function (num) {
  //     var st = studentDimension.top(Infinity);
  //     // Uses top because the version of Crossfilter being used
  //     // doesn't support group.bottom.
  //     return studentGroup.top(num)
  //     	.filter(function(d) { return d.value.averagePoints > 0; })
  //       .map(function(d) {
  //     		var m = st.filter(function(g) { return g.student_name === d.key; })[0];
  //         return {
  //           studentName: d.key,
  //           averagePoints: d.value.averagePoints,
  //           grade: m.grade
  //         };
  //     });
  //   },
  //   bottom: function (num) {
  //     var st = studentDimension.bottom(Infinity);
  //     // Uses top because the version of Crossfilter being used
  //     // doesn't support group.bottom.
  //     return studentGroup.top(num)
  //     	.filter(function(d) { return d.value.averagePoints > 0; })
  //       .map(function(d) {
  //     		var m = st.filter(function(g) { return g.student_name === d.key; })[0];
  //         return {
  //           studentName: d.key,
  //           averagePoints: d.value.averagePoints,
  //           grade: m.grade
  //         };
  //     });
  //   }
  // };

  // console.log(fakeStudentDimension.top(Infinity));

  /* * * * * * * * * * * * *
   *
   * DEFINE CHARTS
   *
   */

  yearPieChart
    .width(150)
    .height(150)
    .dimension(yearDimension)
    .group(yearGroup)
    .innerRadius(30)
    .controlsUseVisibility(true);


  monthBarChart /* dc.barChart('#month-bar-chart', 'chartGroup') */
    .height(180)
    .width(400)
    .margins({top: 10, right: 50, bottom: 30, left: 30})
    .dimension(monthDimension)
    .group(monthGroup)
    .valueAccessor(function(d) {
      return (d.value.averagePoints || 0)
    })
    .elasticY(true)
    .alwaysUseRounding(true)
    .brushOn(true)
    .round(d3.time.months.round)
    .renderHorizontalGridLines(true)
    .renderLabel(true)
    .label(function (d) {
      return numberFormat(d.y);
    })
    .renderTitle(true)
    .title(function (d) {
        // return d.key.split('.')[1];
        return (d.value.averagePoints || 0)
    })
    .xAxisLabel('Months')
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .y(d3.scale.linear().domain([0, monthMax]))
    .gap(1);

    // monthBarChart
    //   .yAxis()
      // .tickFormat(d3.format(',.0s'));
      // .tickFormat(d3.format(',.f'));

    monthBarChart
      .xAxis()
      .tickFormat(d => d.split('.')[1])


  dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
    .height(180)
    .width(200)
    .margins({top: 20, left: 20, right: 10, bottom: 20})
    .dimension(dayOfWeekDimension)
    .group(dayOfWeekGroup)
    .valueAccessor(function(d) {
      return (d.value.averagePoints || 0)
    })
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .renderLabel(true)
    .label(function (d) {
        return d.key.split('.')[1] + '('+  numberFormat((d.value.averagePoints || 0)) + ' points)';
    })
    .renderTitle(true)
    .title(function (d) {
        return d.key.split('.')[1];
    })
    .elasticX(true);

    // handle axis functions separately
    dayOfWeekChart
      .xAxis()
      .ticks(4);


  // gradeBarChart /* dc.barChart('#grade-bar-chart', 'chartGroup') */
  //   .height(180)
  //   .margins({top: 10, right: 50, bottom: 30, left: 30})
  //   .dimension(gradeDimension)
  //   .group(gradeGroup)
  //   .valueAccessor(function(d) {
  //     return d.value.averagePoints
  //   })
  //   .elasticY(true)
  //   .alwaysUseRounding(true)
  //   .brushOn(true)
  //   // .round(d3.time.months.round)
  //   .renderHorizontalGridLines(true)
  //   .renderTitle(true)
  //   .renderLabel(true)
  //   .label(function (d) {
  //     return numberFormat(d.y);
  //   })
  //   .filterPrinter(function (filters) {
  //       var filter = filters[0], s = '';
  //       s += filter + ' -> ' + filter;
  //       return s;
  //   })
  //   .x(d3.scale.ordinal())
  //   .xUnits(dc.units.ordinal)
  //   .gap(1);
  //
  // gradeBarChart
  //   .yAxis()
  //   .tickFormat(d3.format(',.0s'));


  gradeRowChart /* dc.rowChart('#grade-row-chart', 'chartGroup') */
    .width(450)
    .height(350)
    .margins({top: 20, left: 20, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroup)
    .valueAccessor(function(d) {
      return (d.value.averagePoints || 0)
    })
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .renderLabel(true)
    .label(function (d) {
        return 'Grade ' + d.key + ' ('+  numberFormat((d.value.averagePoints || 0)) + ' points)';
    })
    .renderTitle(true)
    .title(function (d) {return d.key;})
    .elasticX(true);

  // handle axis functions separately
  gradeRowChart
    .xAxis()
    .ticks(4);


  khanDataTable /* dc.dataTable('.khan-data-table', 'chartGroup') */
    .dimension(studentDimension)
    // Data table does not use crossfilter group but rather a closure as a grouping function
    .group(function (d) {
          return d.grade;
    })
    .size(10)
    .columns([
      {
        label: 'Student Name',
        format: function(d) { return d.student_name; }
      },
      {
        label: 'Date',
        format: function(d) { return d.date; }
      },
      {
        label: 'Points Earned',
        format: function(d) { return +d.points_per_date; }
      }
    ])
    .sortBy(function (d) { return d.date; })
    .order(d3.ascending) // or d3.descending
    // This custom renderlet ads the color bar for the date groups, which is much nicer
    .on('renderlet', function (table) {
        table
          .selectAll('.dc-table-group')
          .classed('info', true);
    })
    .showGroups(true) // set this to false to remove the 'date' sub-grouping of the data
    ;



  // call .renderAll() to render all charts on the page
  dc.renderAll();

  /* Once rendered you can call .redrawAll() to update charts incrementally when the data changes, without re-rendering everything */
  dc.redrawAll();
});
