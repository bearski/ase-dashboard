queue()
  .defer(d3.json, "/api/scholar_page_count")
  // .defer(d3.json, "pages_read.json")
  .await(makeGraphs);

function makeGraphs(error, data) {

  // console.log(data);

  pagesReadEmailDataTable = dc.dataTable('#pagesReadEmailDataTable');
  pagesReadRowChart = dc.rowChart('#pagesReadRowChart');

  var DTSformat = d3.time.format("%Y-%m-%d");

  // set up data
  data.forEach(function(d) {
    d.formattedDate = DTSformat.parse(d.review_date.substr(0, 10));
    d.month = d3.time.month(d.formattedDate);
  });

  var ndx = crossfilter(data);

  var emailDimension = ndx.dimension(function(d) { return d.email; });

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
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalPagesRead -= +d.page_count;
      p.averagePagesRead = (p.totalPagesRead/p.count);
      return p;
    },
    function () {
      return {
        count: 0,
        totalPagesRead: 0,
        averagePagesRead: 0
      };
    });


  pagesReadRowChart
    .width(400)
    .height(200)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroup)
    .valueAccessor(function(d) { return d.value.averagePagesRead; })
    .ordering(function(d) { return -d.value.averagePagesRead })
    .label(function(d) {
      return 'Average Pages Read for Grade ' +
        d.key + ': ' +
        d.value.totalPagesRead + ' (' +
        d.value.count + ' students)';
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

  dc.renderAll();

  }
