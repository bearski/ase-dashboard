queue()
  .defer(d3.json, "/api/scholar_khan_points")
  // .defer(d3.json, "khan_points.json")
  .await(makeGraphs);

// var monthNames = ["January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];

function makeGraphs(error, data) {

  // console.log(data);

  khanDataTable = dc.dataTable('#khanDataTable');
  khanRowChart = dc.rowChart('#khanRowChart');

  var DTSformat = d3.time.format("%Y-%m-%d");

  // set up data
  data.forEach(function(d) {
    d.formattedDate = DTSformat.parse(d.activity_date.substr(0, 10));
    d.month = d3.time.month(d.formattedDate);
  });

  var ndx = crossfilter(data);

  var emailDimension = ndx.dimension(function(d) { return d.email; });

  var gradeDimension = ndx.dimension(function(d) { return d.grade; });
  var gradeGroup = gradeDimension.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalPoints += +d.points;
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalPoints -= +d.points;
      return p;
    },
    function () {
      return {
        count: 0,
        totalPoints: 0,
      };
    });


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
        d.value.count + ' students)';
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
      function(d) { return + d.points; },
      function(d) { return d.grade; }
    ])
    .sortBy(function(d) { return +d.points; })
    .order(d3.descending);

  dc.renderAll();

}
