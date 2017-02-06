queue()
  .defer(d3.json, "/api/scholar_page_count")
  // .defer(d3.json, "pages_read.json")
  .await(makeGraphs);

function makeGraphs(error, data) {

  // console.log(data);

  pagesReadEmailDataTable = dc.dataTable('#pagesReadEmailDataTable');
  pagesReadRowChart = dc.rowChart('#pagesReadRowChart');

  var dateFormat = d3.time.format("%Y-%m-%d");
  var monthNameYearFormat = d3.time.format("%B %Y");

  // set up data
  data.forEach(function(d) {
    d.formattedDate = dateFormat.parse(d.review_date.substr(0, 10));
    d.month = d3.time.month(d.formattedDate);
  });

  var ndx = crossfilter(data);

  var dateDimension = ndx.dimension(function(d) { return d.month; });

  var emailDimension = ndx.dimension(function(d) { return d.email; });

  var dateGroup = dateDimension.group().reduceSum(function(d) {
      return +d.page_count;
  });

  var emailGroup = emailDimension.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalPagesRead += +d.page_count;
      p.studentName = d.student_name;
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalPagesRead -= +d.page_count;
      p.studentName = d.student_name;
      return p;
    },
    function () {
      return {
        count: 0,
        totalPagesRead: 0,
        studentName: ""
      };
    });


  var gradeDimension = ndx.dimension(function(d) { return d.grade; });

  var gradeGroup = gradeDimension.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalPagesRead += +d.page_count;
      p.averagePagesRead = (p.totalPagesRead/p.count);
      if (d.student_name in p.student_names) {
        p.student_names[d.student_name] += 1
      } else {
        p.student_names[d.student_name] = 1;
        p.student_count++;
      }
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalPagesRead -= +d.page_count;
      p.averagePagesRead = (p.totalPagesRead/p.count);
      if (p.student_names[d.student_name] === 0) {
        delete p.student_names[d.student_name];
        p.student_count--;
      }
      return p;
    },
    function () {
      return {
        count: 0,
        totalPagesRead: 0,
        averagePagesRead: 0,
        student_names: {},
        student_count: 0
      };
    });


  // console.log(gradeGroup.top(10));

  function getPagesPerMonth(source_group) {
    return {
      all: function() {
        return source_group.all().filter(
          function(d) {
            return (d.value.averagePagesRead || 0);
        });
      }
    };
  }

  function ensure_group_bins(source_group) { // (source_group, bins...}
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
                      value :
                      {
                        count: 0,
                        totalPagesRead: 0,
                        averagePagesRead: 0,
                        student_names: {},
                        student_count: 0
                      }
                    }
                  )
                }
              });
            }
            else {
              if(!found[d]) {
                result.push(
                  {
                    key: d,
                    value :
                    {
                      count: 0,
                      totalPagesRead: 0,
                      averagePagesRead: 0,
                      student_names: {},
                      student_count: 0
                    }
                  }
                )
              }
            }
          });
          return result;
        }
      };
    };


  var ppm = getPagesPerMonth(gradeGroup);

  var maxGrade = gradeDimension.top(1)[0].grade;
  var minGrade = gradeDimension.bottom(1)[0].grade;
  var arrGrade = [];

  while(minGrade < maxGrade + 1){
    arrGrade.push(minGrade++);
  }

  var gradeGroupChart =  ensure_group_bins(ppm, arrGrade);
  // console.log(gradeGroupChart.all());

  pagesReadRowChart
    .width(400)
    .height(200)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroupChart)
    .valueAccessor(function(d) { return d.value.averagePagesRead; })
    .ordering(function(d) { return -d.value.averagePagesRead })
    .label(function(d) {
      return 'Average Pages Read for Grade ' +
        d.key + ': ' +
        d.value.totalPagesRead + ' (' +
        d.value.student_count + ' students)';
    })
    .elasticX(true)
    .xAxis()
    .ticks(4);


  pagesReadEmailDataTable
    .width("100pct")
    .height(200)
    .dimension(emailDimension)
    .size(10)
    .group(function(d) { return ''; })
    .columns([
      function(d) { return d.student_name; },
      function(d) { return + d.page_count; },
      function(d) { return d.grade; }
    ])
    .sortBy(function(d) { return +d.page_count; })
    .order(d3.descending);

  dateSelectField = dc.selectMenu('#pagesDateSelectField')
    .dimension(dateDimension)
    .group(dateGroup);

  dateSelectField
    .title(function(d) {
      return monthNameYearFormat(d.key);
    });


  var oldHandler = dateSelectField.filterHandler();
  dateSelectField.filterHandler(
    function(dimension, filters) {
      var parseFilters = filters.map(
        function(d) {
          return new Date(d);
        })
        oldHandler(dimension, parseFilters);
        return filters;
      });

  dc.renderAll();

  }
