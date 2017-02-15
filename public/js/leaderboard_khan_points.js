queue()
  .defer(d3.json, "/api/scholar_khan_points")
  // .defer(d3.json, "khan_points.json")
  .await(makeGraphs);


function makeGraphs(error, data) {

  khanDataTable = dc.dataTable('#khanDataTable');
  khanRowChart = dc.rowChart('#khanRowChart');

  var dateFormat = d3.time.format("%Y-%m-%d");
  var monthNameYearFormat = d3.time.format("%B %Y");

  // set up data
  data.forEach(function(d) {
      d.formattedDate = dateFormat.parse(d.activity_date.substr(0, 10));
      d.month = d3.time.month(d.formattedDate);
  });

  // console.log(data[0]);

  var ndx = crossfilter(data);

  var dateDimension = ndx.dimension(function(d) { return d.month; });

  var emailDimension = ndx.dimension(function(d) { return d.email; });

  var gradeDimension = ndx.dimension(function(d) { return d.grade; });

  var dateGroup = dateDimension.group().reduceSum(function(d) {
      return +d.points_per_date;
  });

  var gradeGroup = gradeDimension.group().reduceSum(function(d) {
      return +d.points_per_date;
  })
  .order(function(p) {
    return p.totalPoints;
  });


  khanRowChart
    .width(400)
    .height(200)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroup)
    .valueAccessor(function(d) { return d.value; })
    // .ordering(function(d) { return -d.value.totalPoints })
    .label(function(d) {
      return 'Total Points for Grade ' +
        d.key + ': ' +
        d.value + ' ('
        // d.value.student_count + ' students)';
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


  dateSelectField = dc.selectMenu('#khanDateSelectField')
    .dimension(dateDimension)
    .group(dateGroup);


  dateSelectField
    .title(function(d) {
      return monthNameYearFormat(d.key);
    });


  var dateSelectHandler = dateSelectField.filterHandler();
  dateSelectField.filterHandler(
    function(dimension, filters) {
      var parseFilters = filters.map(
        function(d) {
          return new Date(d);
        })
        dateSelectHandler(dimension, parseFilters);
        return filters;
      });

  dc.renderAll();

}
