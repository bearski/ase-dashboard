'use strict';
/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */
//

queue()
  .defer(d3.json, '/api/test_khan')
  .defer(d3.json, '/api/test_page_count')
  .defer(d3.json, '/api/test_word_count')
  .await(makeGraphs);


function makeGraphs(error, khanData, pageCountData, wordCountData) {

  var yearPieChart = dc.pieChart("#year-pie-chart");
  var quarterChart = dc.pieChart('#quarter-pie-chart');
  var monthBarChart = dc.barChart('#month-bar-chart');


  // var dayOfWeekChart = dc.rowChart('#day-of-week-chart');
  // var composite = dc.compositeChart("#test_composed");

  var khanRowChart = dc.rowChart('#khan-row-chart');
  var khanDataTable = dc.dataTable('.khan-data-table');

  var pageCountRowChart = dc.rowChart('#pagecount-row-chart');
  var pageCountDataTable = dc.dataTable('.page-data-table');

  var wordCountRowChart = dc.rowChart('#wordcount-row-chart');
  var wordCountLeaderRowChart = dc.rowChart("#wordcount-leader-row-chart");
  var wordCountDataTable = dc.dataTable(".wordcount-data-table");


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
  khanData.forEach(function (d) {
    d.date = dateFormat.parse(d.activity_date);
    d.month = d3.time.month(d.date); // pre-calculate month for performance
    d.value = +d.points_per_date;
    });

  pageCountData.forEach(function (d) {
    d.date = dateFormat.parse(d.review_date);
    d.month = d3.time.month(d.date); // pre-calculate month for performance
    d.value = +d.page_count;
    });


  wordCountData.forEach(function (d) {
    d.date = dateFormat.parse(d.last_update);
    d.month = d3.time.month(d.date); // pre-calculate month for performance
    d.value = +d.word_count;
    });


  console.log(khanData[0]);
  // console.log(pageCountData[0]);
  // console.log(wordCountData[0]);

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


  var arrayMonths = [
    '01.Jan', '02.Feb', '03.Mar', '04.Apr', '05.May', '06.Jun',
    '07.Jul', '08.Aug', '09.Sep', '10.Oct', '11.Nov', '12.Dec'
  ]

  function ensure_month_bins(source_group) { // (source_group, bins...}
    var bins = Array.prototype.slice.call(arguments, 1);
    return {
      all:function () {
        var result = source_group.all().slice(0); // copy original results (we mustn't modify them)
        var found = {};
        result.forEach(function(d) {
          found[d.key] = true;
        });

        bins.forEach(
          function(d) {
            if (d.constructor == Array) {
              d.forEach(function(x) {
                if(!found[x]) {
                  result.push(
                    {
                      key: x,
                      value:{
                        0 :
                        {
                          count: 0,
                          totalValue: 0,
                          averageValue: 0,
                          studentNames: {},
                          studentCount: 0
                        },
                        1 :
                        {
                          count: 0,
                          totalValue: 0,
                          averageValue: 0,
                          studentNames: {},
                          studentCount: 0
                        },
                        2 :
                        {
                          count: 0,
                          totalValue: 0,
                          averageValue: 0,
                          studentNames: {},
                          studentCount: 0
                        },
                      }
                    }
                  )
                }
              });
            }
          });
          return result;
        }
      };
    };


  function remove_empty_bins(source_group) {
    function non_zero_pred(d) {
      return (d.value.averageValue || 0) != 0;
    }
    return {
      all: function () {
        return source_group.all().filter(non_zero_pred);
      },
      top: function(n) {
        return source_group.top(Infinity)
        .filter(non_zero_pred)
        .slice(0, n);
      }
    };
  }


  function mirror_dimension() {
    var dims = Array.prototype.slice.call(arguments, 0);
    function mirror(fname) {
      return function(v) {
        dims.forEach(function(dim) {
          dim[fname](v);
        });
      };
    }
    return {
      filter: mirror('filter'),
      filterExact: mirror('filterExact'),
      filterRange: mirror('filterRange'),
      filterFunction: mirror('filterFunction')
    };
  }

  //  set up reduce average functions
  function reduceAdd(p, d) {
    ++p.count;
    p.totalValue += d.value;
    if (d.student_name in p.studentNames) {
      p.studentNames[d.student_name]++
    } else {
      p.studentNames[d.student_name] = 1;
      p.studentCount++;
    }

    p.averageValue = (p.totalValue/p.studentCount);
    return p;
  }

  function reduceRemove(p, d) {
    --p.count;
    p.totalValue -= d.value;
    p.studentNames[d.student_name]--
    if (p.studentNames[d.student_name] === 0) {
      delete p.studentNames[d.student_name];
      p.studentCount--;
    }

    p.averageValue = (p.totalValue/p.studentCount);
    return p;
  }

  function reduceInitial() {
    return {
      count: 0,
      totalValue: 0,
      averageValue: 0,
      studentNames: {},
      studentCount: 0
    };
  }


  function quarterDimension(d) {
    var month =  monthNumberFormat(d.date);
    if (month <= 3) {
      return 'Q1';
    } else if (month > 3 && month <= 6) {
      return 'Q2';
    } else if (month > 6 && month <= 9) {
      return 'Q3';
    } else {
      return 'Q4';
    }
  }



  //
  // function rescale(chart, group, fakeGroup) {
  //   console.log(chart);
  //   let groupSize = this.getGroupSize(fakeGroup, this.yValue);
  //
  //   let minTop = group.top(groupSize)[groupSize-1].value;
  //   let minimum = minTop > 0 ? minTop : 0.0001;
  //   let maximum = group.top(1)[0].value;
  //
  //   chart.y(d3.scale.log().domain([minimum, maximum])
  //     .range(this.height, 0)
  //     .nice()
  //     .clamp(true));
  // }


  // use crossfilter to make dimensions and groups
  var kdx = crossfilter(khanData);
  var allK = kdx.groupAll();

  var pdx = crossfilter(pageCountData);
  var allP = pdx.groupAll();

  var wdx = crossfilter(wordCountData);
  var allW = wdx.groupAll();

  // dimensions

  //  khan

  var k_quarterDimension = kdx.dimension(function (d) {
    return quarterDimension(d)
  });

  var k_mirror_quarter = kdx.dimension(function (d) {
    return quarterDimension(d)
  });

  var k_dayOfWeekDimension = kdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var k_mirror_dayOfWeek = kdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var k_gradeDimension = kdx.dimension(function (d) {
    return  d.grade;
  });

  var k_mirror_grade = kdx.dimension(function (d) {
    return  d.grade;
  });

  var k_monthDimension = kdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var k_mirror_month = kdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var k_studentDimension = kdx.dimension(function(d) {
    return d.student_name;
  });

  var k_mirror_student = kdx.dimension(function(d) {
    return d.student_name;
  });

  var k_yearDimension = kdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  var k_mirror_year = kdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  // groups
  var k_dayOfWeekGroup = k_dayOfWeekDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var k_gradeGroup = k_gradeDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var k_monthGroup = k_monthDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var k_studentGroup = k_studentDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var k_yearGroup = k_yearDimension.group();

  var k_quarterGroup = k_quarterDimension.group();
  //  khan

  // page count
  var p_quarterDimension = pdx.dimension(function (d) {
    return quarterDimension(d)
  });

  var p_mirror_quarter = pdx.dimension(function (d) {
    return quarterDimension(d)
  });


  var p_dayOfWeekDimension = pdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var p_mirror_dayOfWeek = pdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var p_gradeDimension = pdx.dimension(function (d) {
    return  d.grade;
  });

  var p_mirror_grade = pdx.dimension(function (d) {
    return  d.grade;
  });

  var p_monthDimension = pdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var p_mirror_month = pdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var p_studentDimension = pdx.dimension(function(d) {
    return d.student_name;
  });

  var p_mirror_student = pdx.dimension(function(d) {
    return d.student_name;
  });

  var p_yearDimension = pdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  var p_mirror_year = pdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  // groups
  var p_dayOfWeekGroup = p_dayOfWeekDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var p_gradeGroup = p_gradeDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var p_monthGroup = p_monthDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var p_studentGroup = p_studentDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var p_yearGroup = p_yearDimension.group(); //.reduce(reduceAdd, reduceRemove, reduceInitial);

  var p_quarterGroup = p_quarterDimension.group();
  // page count


  //  word count

  var w_quarterDimension = wdx.dimension(function (d) {
    return quarterDimension(d)
  });

  var w_mirror_quarter = wdx.dimension(function (d) {
    return quarterDimension(d)
  });

  var w_dayOfWeekDimension = wdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var w_mirror_dayOfWeek = wdx.dimension(function (d) {
    return  weekDayFormat(d.date) + '.' + dayNameFormat(d.date);
  });

  var w_gradeDimension = wdx.dimension(function (d) {
    return  d.grade;
  });

  var w_mirror_grade = wdx.dimension(function (d) {
    return  d.grade;
  });

  var w_monthDimension = wdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var w_mirror_month = wdx.dimension(function (d) {
    return  monthNumberFormat(d.date) + '.' + monthNameFormat(d.date);
  });

  var w_studentDimension = wdx.dimension(function(d) {
    return d.student_name;
  });

  var w_mirror_student = wdx.dimension(function(d) {
    return d.student_name;
  });

  var w_yearDimension = wdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  var w_mirror_year = wdx.dimension(function (d) {
    return yearFormat(d.date);
  });

  // groups
  var w_dayOfWeekGroup = w_dayOfWeekDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var w_gradeGroup = w_gradeDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var w_monthGroup = w_monthDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var w_studentGroup = w_studentDimension.group().reduce(reduceAdd, reduceRemove, reduceInitial);

  var w_yearGroup = w_yearDimension.group();

  var w_quarterGroup = w_quarterDimension.group();


  var filteredStudentGroup = remove_empty_bins(w_studentGroup);
  //  word count


  var khanFakeDimension = {
    top: function (num) {
      var st = k_studentDimension.top(Infinity);
      // Uses top because the version of Crossfilter being used
      // doesn't support group.bottom.
      return k_studentGroup.top(num)
      	.filter(function(d) { return d.value.totalValue > 0; })
        .map(function(d) {
      		var m = st.filter(function(g) { return g.student_name === d.key; })[0];
          return {
            studentName: d.key,
            totalValue: d.value.totalValue,
            grade: m.grade
          };
      });
    },
    bottom: function (num) {
      var st = k_studentDimension.bottom(Infinity);
      // Uses top because the version of Crossfilter being used
      // doesn't support group.bottom.
      return k_studentGroup.top(num)
      	.filter(function(d) { return d.value.totalValue > 0; })
        .map(function(d) {
      		var m = st.filter(function(g) { return g.student_name === d.key; })[0];
          return {
            studentName: d.key,
            totalValue: d.value.totalValue,
            grade: m.grade
          };
      });
    }
  };

  // console.log(p_studentGroup.top(50))

  var pageCountFakeDimension = {
    top: function (num) {
      var st = p_studentDimension.top(Infinity);
      // Uses top because the version of Crossfilter being used
      // doesn't support group.bottom.
      return p_studentGroup.top(num)
        .filter(function(d) { return d.value.totalValue > 0; })
        .map(function(d) {
          var m = st.filter(function(g) { return g.student_name === d.key; })[0];
          return {
            studentName: d.key,
            totalValue: d.value.totalValue,
            grade: m.grade
          };
      });
    },
    bottom: function (num) {
      var st = p_studentDimension.bottom(Infinity);
      // Uses top because the version of Crossfilter being used
      // doesn't support group.bottom.
      return p_studentGroup.top(num)
        .filter(function(d) { return d.value.totalValue > 0; })
        .map(function(d) {
          var m = st.filter(function(g) { return g.student_name === d.key; })[0];
          return {
            studentName: d.key,
            totalValue: d.value.totalValue,
            grade: m.grade
          };
      });
    }
  };


  function combine_groups() { // (groups...)
      var groups = Array.prototype.slice.call(arguments);
      return {
          all: function() {
              var alls = groups.map(function(g) { return g.all(); });
              var gm = {};
              alls.forEach(function(a, i) {
                  a.forEach(function(b) {
                      if(!gm[b.key]) {
                          gm[b.key] = new Array(groups.length);
                          for(var j=0; j<groups.length; ++j)
                              gm[b.key][j] = 0;
                      }
                      gm[b.key][i] = b.value;
                  });
              });
              var ret = [];
              for(var k in gm)
                  ret.push({key: k, value: gm[k]});
              return ret;
          }
      };
  }

  var combined = combine_groups(p_monthGroup, k_monthGroup, w_monthGroup);

  var combinedAllMonths =  ensure_month_bins(combined, arrayMonths);


  /* * * * * * * * * * * * *
   *
   * DEFINE CHARTS
   *
   */

  yearPieChart
    .width(180)
    .height(180)
    .dimension(mirror_dimension(k_yearDimension, p_mirror_year, w_mirror_year))
    .group(k_yearGroup)
    .innerRadius(30)
    .controlsUseVisibility(true)
    .label(function (d) { return d.key; })
    .renderTitle(true)
    .title(function (d) { return '' });


  quarterChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
    .width(180)
    .height(180)
    .dimension(mirror_dimension(k_quarterDimension, p_mirror_quarter, w_mirror_quarter))
    .group(k_quarterGroup)
    .radius(80)
    .innerRadius(30)
    .controlsUseVisibility(true)
    .label(function (d) { return d.key; })
    .renderTitle(true)
    .title(function (d) { return '' });


  monthBarChart /* dc.barChart('#volume-month-chart', 'chartGroup') */
    .height(215)
    .width(450)
    .margins({top: 10, right: 50, bottom: 30, left: 25})
    .dimension(mirror_dimension(k_monthDimension, p_mirror_month, w_mirror_month))
    .transitionDuration(500)
    .group(combinedAllMonths, 'Pages Read', function(d) {
      // var A = p_monthGroup.top(1)[0].value.averageValue
      // var B = k_monthGroup.top(1)[0].value.averageValue
      // return ((1 + (d.value[0].averageValue - A) * (10 - 1) / (B - A)) || 0)
      return (d.value[0].averageValue || 0);
    })
    .stack(combinedAllMonths, 'Khan Points', function(d) {
      // var A = p_monthGroup.top(1)[0].value.averageValue
      // var B = k_monthGroup.top(1)[0].value.averageValue
      // return (1 + (d.value[1].averageValue - A) * (10 - 1) / (B - A))
      return (d.value[1].averageValue/150 || 0);
    })
    .stack(combinedAllMonths, 'Word Count', function(d) {
      // var A = p_monthGroup.top(1)[0].value.averageValue
      // var B = k_monthGroup.top(1)[0].value.averageValue
      // return (1 + (d.value[1].averageValue - A) * (10 - 1) / (B - A))
      return (d.value[2].averageValue/100 || 0);
    })
    .round(d3.time.months.round)
    .alwaysUseRounding(true)
    .renderHorizontalGridLines(true)
    .brushOn(true)
    .gap(1)
    .legend(dc.legend().x(35).y(15).itemHeight(13).gap(7))
    .renderTitle(true)
    .title(function(d) {
      var value
      switch (this.layer) {
        case 'Pages Read':
        value = (d.value[0].averageValue || 0);
        break;
        case 'Khan Points':
          value = (d.value[1].averageValue || 0);
          break;
        case 'Word Count':
          value = (d.value[2].averageValue || 0);
          break;
        }

      return d.key.split('.')[1] + '[' + this.layer + ']: ' + numberFormat(value);
    })

  monthBarChart
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .xAxis()
    .tickFormat(d => d.split('.')[1])

  monthBarChart
    .y(d3.scale.linear().domain([0, 50000]))
    .elasticY(true)
    .yAxis()
    .ticks(0);

  //
  // monthBarChart
  //   .on('preRedraw', (chart) => {
  //     this.rescale(chart, group, fakeGroup);
  //   });


    // .on('preRedraw', function(chart) {
    //   chart.x().domain([2, d3.max(chart.group().all(), kv=>kv.key) + 0.1]);
    //   chart.rescale();
    // });




  // dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
  //   .height(180)
  //   .width(200)
  //   .margins({top: 20, left: 20, right: 10, bottom: 20})
  //   // .dimension(k_dayOfWeekDimension)
  //   .dimension(mirror_dimension(k_dayOfWeekDimension, p_mirror_dayOfWeek, w_mirror_dayOfWeek))
  //   .group(k_dayOfWeekGroup)
  //   .valueAccessor(function(d) {
  //     return (d.value.averageValue || 0)
  //   })
  //   .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
  //   .renderLabel(true)
  //   .label(function (d) {
  //       return d.key.split('.')[1] + '('+  numberFormat((d.value.averageValue || 0)) + ')';
  //   })
  //   .renderTitle(true)
  //   .title(function (d) {
  //       return d.key.split('.')[1];
  //   })
  //   .elasticX(true);
  //
  //   // handle axis functions separately
  //   dayOfWeekChart
  //     .xAxis()
  //     .ticks(2);


  khanRowChart /* dc.rowChart('#grade-row-chart', 'chartGroup') */
    .width(450)
    .height(350)
    .margins({top: 20, left: 20, right: 10, bottom: 20})
    .dimension(mirror_dimension(k_gradeDimension, p_mirror_grade, w_mirror_grade))
    .group(k_gradeGroup)
    .valueAccessor(function(d) {
      return (d.value.averageValue || 0)
    })
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .renderLabel(true)
    .label(function (d) {
        return 'Grade ' + d.key + ': ' +
          numberFormat((d.value.averageValue || 0)) +
          ' (' + d.value.studentCount + ' students)';
    })
    .renderTitle(true)
    .title(function (d) {return d.key;})
    .elasticX(true);

  // handle axis functions separately
  khanRowChart
    .xAxis()
    .ticks(4);


  pageCountRowChart /* dc.rowChart('#pagecount-row-chart', 'chartGroup') */
    .width(450)
    .height(350)
    .margins({top: 20, left: 20, right: 10, bottom: 20})
    .dimension(mirror_dimension(p_gradeDimension, k_mirror_grade, w_mirror_grade))
    .group(p_gradeGroup)
    .valueAccessor(function(d) {
      return (d.value.averageValue || 0)
    })
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .renderLabel(true)
    .label(function (d) {
        return 'Grade ' + d.key + ': ' +
          numberFormat((d.value.averageValue || 0)) +
          ' (' + d.value.studentCount + ' students)';
    })
    .renderTitle(true)
    .title(function (d) {return d.key;})
    .elasticX(true);

  // handle axis functions separately
  pageCountRowChart
    .xAxis()
    .ticks(4);


  wordCountRowChart /* dc.rowChart('#grade-row-chart', 'chartGroup') */
    .width(450)
    .height(350)
    .margins({top: 20, left: 20, right: 10, bottom: 20})
    .dimension(mirror_dimension(w_gradeDimension, k_mirror_grade, p_mirror_grade))
    .group(w_gradeGroup)
    .valueAccessor(function(d) {
      return (d.value.averageValue || 0)
    })
    .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    .renderLabel(true)
    .label(function (d) {
        return 'Grade ' + d.key + ': ' +
          numberFormat((d.value.averageValue || 0)) +
          ' (' + d.value.studentCount + ' students)';
    })
    .ordering(function(d) { return -d.value.averageValue })
    .renderTitle(true)
    .title(function (d) {return d.key;})
    .elasticX(true);

  // handle axis functions separately
  wordCountRowChart
    .xAxis()
    .ticks(4);


  khanDataTable /* dc.dataTable('.khan-data-table', 'chartGroup') */
    // .dimension(k_studentDimension)
    .dimension(khanFakeDimension)
    // Data table does not use crossfilter group but rather a closure as a grouping function
    .group(function (d) {
          return 'Grade ' +d.grade;
    })
    .size(10)
    .columns([
      {
        label: 'Student Name',
        format: function(d) { return d.studentName; }
      },
      {
        label: 'Points Earned',
        format: function(d) { return +d.totalValue; }

      }
    ])
    .sortBy(function (d) { return d.totalValue; })
    .order(d3.ascending) // or d3.descending
    // This custom renderlet ads the color bar for the date groups, which is much nicer
    .on('renderlet', function (table) {
        table
          .selectAll('.dc-table-group')
          .classed('info', true);
    })
    .showGroups(true);


  pageCountDataTable /* dc.dataTable('.page-data-table', 'chartGroup') */
    .dimension(pageCountFakeDimension)
    // Data table does not use crossfilter group but rather a closure as a grouping function
    .group(function (d) {
          return 'Grade ' +d.grade;
    })
    .size(10)
    .columns([
      {
        label: 'Student Name',
        format: function(d) { return d.studentName; }
      },
      {
        label: 'Pages Read',
        format: function(d) { return +d.totalValue; }
      }
    ])
    .sortBy(function (d) { return d.totalValue; })
    .order(d3.ascending) // or d3.descending
    // This custom renderlet ads the color bar for the date groups, which is much nicer
    .on('renderlet', function (table) {
        table
          .selectAll('.dc-table-group')
          .classed('info', true);
    })
    .showGroups(true);

  //
  // composite
  //   .height(215)
  //   .width(400)
  //   .transitionDuration(500)
  //   .brushOn(false)
  //   .elasticY(true)
  //   // .mouseZoomable(true)
  //   .renderLabel(true)
  //   .renderHorizontalGridLines(true)
  //   .group(k_monthGroup)
  //   .x(d3.scale.ordinal())
  //   .xUnits(dc.units.ordinal)
  //   .legend(dc.legend().x(40).y(0).itemHeight(16).gap(4))
  //   .compose([
  //     dc.lineChart(composite)
  //       .group(k_monthGroup, 'Khan Points')
  //       .interpolate('basis')
  //       .colors('orange')
  //       .valueAccessor(function(d) { return (d.value.averageValue || 0) })
  //     ,
  //     dc.lineChart(composite)
  //       .group(p_monthGroup, 'Pages Read')
  //       .interpolate('basis')
  //       // .colors(['#aa00ff'])
  //       .colors('blue')
  //       .valueAccessor(function(d) { return (d.value.averageValue || 0) })
  //       .useRightYAxis(true)
  //       ,
  //       dc.lineChart(composite)
  //         .group(w_monthGroup, 'Word Count')
  //         .interpolate('basis')
  //         // .colors(['#aa00ff'])
  //         .colors('green')
  //         .valueAccessor(function(d) { return (d.value.averageValue || 0) })
  //         // .useRightYAxis(true)
  //
  //   ]);
  //
  //   composite
  //   .xAxis()
  //   .tickFormat(d => d.split('.')[1])

    // console.log(w_studentDimension.top(10))
  // console.log(filteredStudentGroup.top(10))


  wordCountLeaderRowChart
    .width(600)
    .height(350)
    .margins({ top: 0, right: 10, bottom: 20, left: 5 })
    .dimension(w_studentDimension)
    .group(filteredStudentGroup)
    .elasticX(true)
    .valueAccessor(function(d) { return +d.value.totalValue; })
    .rowsCap(20)
    .othersGrouper(false)
    .label(function(d) {
      return (d.key + ": " + d.value.totalValue);
    })
    .ordering(function(d) { return -d.value.totalValue })
    .xAxis()
    .ticks(5);


  wordCountDataTable
    .width(400)
    .height(200)
    .dimension(w_studentDimension)
    .size(15)
    .group(function (d) {
          return 'Grade ' +d.grade;
    })
    .size(10)
    .columns([
      {
        label: 'Student Name',
        format: function(d) { return d.student_name; }
      },
      {
        label: 'File Name',
        format: function(d) { return d.file_name; }
      },
      {
        label: 'Word Count',
        format: function(d) { return +d.word_count; }

      }
    ])
    .sortBy(function (d) { return d.word_count; })
    .order(d3.descending) // or d3.descending
    // This custom renderlet ads the color bar for the date groups, which is much nicer
    .on('renderlet', function (table) {
        table
          .selectAll('.dc-table-group')
          .classed('info', true);
    })
    .showGroups(true);



  // call .renderAll() to render all charts on the page
  dc.renderAll();

  /* Once rendered you can call .redrawAll() to update charts incrementally when the data changes, without re-rendering everything */
  dc.redrawAll();
}
//);
