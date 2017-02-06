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
  wordCountGradeRowChart = dc.rowChart('#wordCountGradeRowChart');


  // Make sure date is parsed based on specific format (2014-04-25)
  var dateFormat = d3.time.format("%Y-%m-%d");
  var numberFormat = d3.format(".2f");
  var monthNameYearFormat = d3.time.format("%B %Y");

  // set up data
  data.forEach(function(d) {
    d.t = dateFormat.parse(d.last_update.substr(0, 10));
    d.month = d3.time.month(d.t);
  });

  // console.log(data);

  var ndx = crossfilter(data);

  var dateDimension = ndx.dimension(function(d) { return d.month; });

  var emailDimemsion = ndx.dimension(function(d) { return d.email; });

  var dateGroup = dateDimension.group().reduceSum(function(d) {
      return +d.word_count;
  });


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


  function remove_empty_bins(source_group) {
      function non_zero_pred(d) {
          return (d.value.totalWordCount || 0) != 0;
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

  var filteredEmailGroup = remove_empty_bins(emailGroup);


  wordCountGradeRowChart
    .width(400)
    .height(250)
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
    .height(250)
    .margins({ top: 0, right: 10, bottom: 20, left: 5 })
    .dimension(emailDimemsion)
    .group(filteredEmailGroup)
    .elasticX(true)
    .valueAccessor(function(d) { return +d.value.totalWordCount; })
    .rowsCap(15)
    .othersGrouper(false)
    .label(function(d) {
      return (d.value.studentName + ": " + d.value.totalWordCount);
    })
    .ordering(function(d) { return -d.value.totalWordCount })
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

    dateSelectField = dc.selectMenu('#wordsDateSelectField')
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
