queue()
    .defer(d3.json, "/api/scholar_word_count")
    // .defer(d3.json, "word_count.json")
    .await(makeGraphs);

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function debug(stuff) {
    if (typeof console != "undefined") {
        console.log(stuff);
    }
}

function makeGraphs(error, data) {

  // charts
  emailDataTable = dc.dataTable("#emailDataTable");
  leaderRowChart = dc.rowChart("#leaderRowChart");
  // wordCountPieChart = dc.pieChart('#wordCountPieChart');
  // wordCountBarChart = dc.barChart("#wordCountBarChart");
  wordCountGradeRowChart = dc.rowChart('#wordCountGradeRowChart');


  // var leaderDataTable = dc.dataTable("#leaderDataTable");

  // var matrixDataTable = dc.dataTable("#matrixDataTable");
  // var matrixQuestionDataTable = dc.dataTable("#matrixQuestionDataTable");
  // var monthBarChart = dc.barChart("#submissions-per-month");
  // var questionRowChart = dc.rowChart("#questionRowChart");


  // Make sure date is parsed based on specific format (2014-04-25)
  var DTSformat = d3.time.format("%Y-%m-%d");
  var numberFormat = d3.format(".2f");

  // set up data
  data.forEach(function(d) {
    d.t = DTSformat.parse(d.last_update.substr(0, 10));
    d.month = d3.time.month(d.t);
  });

  // console.log(data);

  var ndx = crossfilter(data);
  // var all = ndx.groupAll();

  // Updated version
  // dc.dataCount(".dc-data-count").dimension(ndx).group(all);


  var emailDimemsion = ndx.dimension(function(d) { return d.email; });

  var emailGroup = emailDimemsion.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalWordCount += +d.word_count;
      p.studentName = d.student_name;
      return p;
    },

    function (p, d) {
      --p.count;
      p.totalWordCount -= +d.word_count;
      p.studentName = d.student_name;
      return p;
    },

    function () {
      return {
        count: 0,
        totalWordCount: 0,
        studentName: ""
      };
    }).order(function(p) {
      return p.totalWordCount;
    });

  // debug(emailGroup.top(20));


  var gradeDimension = ndx.dimension(function(d) {return d.grade;});
  var gradeGroup = gradeDimension.group().reduce(
    function (p, d) {
      ++p.count;
      p.totalWordCount += +d.word_count;
      return p;
    },
    function (p, d) {
      --p.count;
      p.totalWordCount -= +d.word_count;
      return p;
    },
    function () {
      return { count: 0, totalWordCount: 0, grade: 0 };
    });


  // console.log('emailDimemsion');
  // console.log(emailDimemsion.top(10));

  //
  // wordCountPieChart
  //   .width(280)
  //   .height(280)
  //   .radius(125)
  //   .innerRadius(40)
  //   .dimension(gradeDimension)
  //   .group(gradeGroup)
  //   .valueAccessor(function(d) { return d.value.count; })
  //   .label(function(d) {
  //     return 'Grade ' + d.key + ' (' + d.value.count + ' students)';
  //   });


  // wordCountBarChart
  //   .width(768)
  //   .height(480)
  //   .x(d3.scale.linear().domain([6,20]))
  //   .brushOn(false)
  //   .yAxisLabel("Word Count")
  //   .dimension(gradeDimension)
  //   .group(gradeGroup)
  //   .valueAccessor(function(d) { return d.value.totalWordCount; });
    // .on('renderlet', function(chart) {
    //     chart.selectAll('rect').on("click", function(d) {
    //         console.log("click!", d);
    //     });
    // });

  wordCountGradeRowChart
    .width(800)
    .height(200)
    .margins({top: 20, left: 10, right: 10, bottom: 20})
    .dimension(gradeDimension)
    .group(gradeGroup)
    .valueAccessor(function(d) { return d.value.totalWordCount; })
    .ordering(function(d) { return -d.value.totalWordCount })
    .label(function(d) {
      return 'Total Word Count for Grade ' +
        d.key + ': ' +
        d.value.totalWordCount + ' (' +
        d.value.count + ' students)';
    })
    .elasticX(true)
    .xAxis()
    .ticks(4);


  leaderRowChart
    .width(600)
    .height(300)
    .margins({
      top: 0,
      right: 10,
      bottom: 20,
      left: 5
    })
    .dimension(emailDimemsion)
    .group(emailGroup)
    .elasticX(true)
    .valueAccessor(function(d) {
      return +d.value.totalWordCount;
    })
    .rowsCap(15)
    .othersGrouper(false)
    .label(function(d) {
      return (d.value.studentName + ": " + d.value.totalWordCount);
    })
    .ordering(function(d) {
      return -d.value.totalWordCount
    })
    .xAxis()
    .ticks(5);


  emailDataTable
    .width("100pct")
    .height(200)
    .dimension(emailDimemsion)
    .size(15)
    .group(function(d) { return d.student_name; })
    .columns([
      function(d) { return '        '; },
      function(d) { return d.file_name; },
      function(d) { return d.grade; },
      function(d) { return numberFormat(+d.word_count); }
    ])
    .sortBy(function(d) { return d.student_name; })
    .order(d3.ascending);

  dc.renderAll();
}
