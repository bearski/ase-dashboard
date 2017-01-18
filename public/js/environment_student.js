queue()
  .defer(d3.json, "/api/maf_response_student")
// .defer(d3.json, "maf_response_student.json")
  .await(makeGraphs);

var monthNames = [
    "January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October",
    "November", "December"
];

function makeGraphs(error, data) {

  // charts
  studentCategoryRowChart = dc.rowChart("#studentCategoryRowChart");
  studentQuestionRowChart = dc.rowChart("#studentQuestionRowChart");
  studentCategoryDataTable = dc.dataTable("#studentCategoryDataTable");
  studentQuestionDataTable = dc.dataTable("#studentQuestionDataTable");

  // Make sure date is parsed based on specific format (2014-04-25)
  var DTSformat = d3.time.format("%Y-%m-%d");
  var numberFormat = d3.format(".2f");

  // set up data
  data.forEach(function(d) {
      d.t = DTSformat.parse(d.response_date.substr(0, 10));
      d.month = d3.time.month(d.t);
      d.MonthName = monthNames[d.t.getMonth()];
  });

  // console.log("data");
  // console.log(data);

  // --- Assign Colour to Categories ---
  var colorScale = d3.scale.ordinal().domain([
      "Sense of Belonging",
      "Love of Learning",
      "Rigour",
      "Physically Conducive to Learning",
      "Culture of Reflection",
      "General"
  ]).range([
      "#66B2FF",
      "#B0E0E6",
      "#00FF7F",
      "#87CEFA",
      "#48D1CC",
      "#B0C4DE"
  ]);

  var ndx = crossfilter(data);

  var categoryDim = ndx.dimension(function(d) {
      return d.category;
  });

  var categoryGroup = categoryDim.group().reduce(
  //add
  function(p, v) {
      ++p.count;
      p.totalScore += +v.score;
      p.averageScore = (p.totalScore / p.count);
      switch (v.grade) {
        case 7:
          ++p.grade7count;
          p.grade7totalScore += +v.score;
          p.grade7averageScore = (p.grade7totalScore / p.grade7count);
          break;
        case 8:
          ++p.grade8count;
          p.grade8totalScore += +v.score;
          p.grade8averageScore = (p.grade8totalScore / p.grade8count);
          break;
        case 9:
          ++p.grade9count;
          p.grade9totalScore += +v.score;
          p.grade9averageScore = (p.grade9totalScore / p.grade9count);
          break;
        case 10:
          ++p.grade10count;
          p.grade10totalScore += +v.score;
          p.grade10averageScore = (p.grade10totalScore / p.grade10count);
          break;
        case 0:
          ++p.grade0count;
          p.grade0totalScore += +v.score;
          p.grade0averageScore = (p.grade0totalScore / p.grade0count);
      }
      return p;
  },
  //remove
  function(p, v) {
      --p.count;
      p.totalScore -= +v.score;
      p.averageScore = (p.totalScore / p.count);
      switch (v.grade) {
        case 7:
          --p.grade7count;
          p.grade7totalScore -= +v.score;
          p.grade7averageScore = (p.grade7totalScore / p.grade7count);
          break;
        case 8:
          --p.grade8count;
          p.grade8totalScore -= +v.score;
          p.grade8averageScore = (p.grade8totalScore / p.grade8count);
          break;
        case 9:
          --p.grade9count;
          p.grade9totalScore -= +v.score;
          p.grade9averageScore = (p.grade9totalScore / p.grade9count);
          break;
        case 10:
          --p.grade10count;
          p.grade10totalScore -= +v.score;
          p.grade10averageScore = (p.grade10totalScore / p.grade10count);
          break;
        case 0:
          --p.grade0count;
          p.grade0totalScore -= +v.score;
          p.grade0averageScore = (p.grade0totalScore / p.grade0count);
      }
      return p;
  },
  //init
  function() {
      return {
        count: 0,
        totalScore: 0,
        averageScore: 0,
        grade7count: 0,
        grade7averageScore: 0,
        grade7totalScore: 0,
        grade8count: 0,
        grade8averageScore: 0,
        grade8totalScore: 0,
        grade9count: 0,
        grade9averageScore: 0,
        grade9totalScore: 0,
        grade10count: 0,
        grade10averageScore: 0,
        grade10totalScore: 0,
        grade0count: 0,
        grade0totalScore: 0,
        grade0averageScore: 0
      };
  });


  var questionDim = ndx.dimension(function(d) {
      return d.question;
  });


  var questionGroup = questionDim.group().reduce(
    //add
    function(p, v) {
      ++p.count;
      p.category = v.category;
      p.totalScore += +v.score;
      p.averageScore = (p.totalScore / p.count);
      switch (v.grade) {
        case 7:
          ++p.grade7count;
          p.grade7totalScore += +v.score;
          p.grade7averageScore = (p.grade7totalScore / p.grade7count);
          break;
        case 8:
          ++p.grade8count;
          p.grade8totalScore += +v.score;
          p.grade8averageScore = (p.grade8totalScore / p.grade8count);
          break;
        case 9:
          ++p.grade9count;
          p.grade9totalScore += +v.score;
          p.grade9averageScore = (p.grade9totalScore / p.grade9count);
          break;
        case 10:
          ++p.grade10count;
          p.grade10totalScore += +v.score;
          p.grade10averageScore = (p.grade10totalScore / p.grade10count);
          break;
        case 0:
          ++p.grade0count;
          p.grade0totalScore += +v.score;
          p.grade0averageScore = (p.grade0totalScore / p.grade0count);
      }
      return p;
    },
    //remove
    function(p, v) {
      --p.count;
      p.category = v.category;
      p.totalScore -= +v.score;
      p.averageScore = (p.totalScore / p.count);
      switch (v.grade) {
        case 7:
          --p.grade7count;
          p.grade7totalScore -= +v.score;
          p.grade7averageScore = (p.grade7totalScore / p.grade7count);
          break;
        case 8:
          --p.grade8count;
          p.grade8totalScore -= +v.score;
          p.grade8averageScore = (p.grade8totalScore / p.grade8count);
          break;
        case 9:
          --p.grade9count;
          p.grade9totalScore -= +v.score;
          p.grade9averageScore = (p.grade9totalScore / p.grade9count);
          break;
        case 10:
          --p.grade10count;
          p.grade10totalScore -= +v.score;
          p.grade10averageScore = (p.grade10totalScore / p.grade10count);
          break;
        case 0:
          --p.grade0count;
          p.grade0totalScore -= +v.score;
          p.grade0averageScore = (p.grade0totalScore / p.grade0count);
      }
      return p;
    },
    //init
    function() {
      return {
        category: '',
        count: 0,
        totalScore: 0,
        averageScore: 0,
        grade7count: 0,
        grade7averageScore: 0,
        grade7totalScore: 0,
        grade8count: 0,
        grade8averageScore: 0,
        grade8totalScore: 0,
        grade9count: 0,
        grade9averageScore: 0,
        grade9totalScore: 0,
        grade10count: 0,
        grade10averageScore: 0,
        grade10totalScore: 0,
        grade0count: 0,
        grade0totalScore: 0,
        grade0averageScore: 0
      };
    }
  );


  var pseudoCategoryDimension = {
    top: function(x) {
      return categoryGroup.all().map(function(grp) {
        return {"key": grp.key, "value": grp.value};
      });
    }
  };


  function remove_empty_question(source_group) {
    return {
      all: function() {
        return source_group.all().filter(
          function(d) {
            return (d.value.averageScore || 0) != 0;
        });
      }
    };
  }


  var filteredQuestionGroup = remove_empty_question(questionGroup);
  var pseudoQuestionDimension = {
    top: function(x) {
      return filteredQuestionGroup.all().map(function(grp) {
        return {"key": grp.key, "value": grp.value};
      });
    }
  };


  studentCategoryRowChart
    .width(400)
    .height(300)
    .margins({top: 0, right: 10, bottom: 20, left: 5})
    .dimension(categoryDim)
    .group(categoryGroup)
    .valueAccessor(function(p) { return p.value.averageScore; })
    .elasticX(false)
    .xAxis()
    .ticks(5);

    // studentCategoryRowChart.renderlet(function(chart) {
    //           dc.events.trigger(function() {
    //               console.log(studentCategoryRowChart.filters())
    //           });
    //       })



  studentQuestionRowChart
    .width(400)
    .height(600)
    .margins({top: 0, right: 10, bottom: 20, left: 5})
    .dimension(questionDim)
    .group(filteredQuestionGroup)
    .elasticX(true)
    .valueAccessor(function(d) { return d.value.averageScore; })
    .xAxis()
    .ticks(3);


  studentCategoryDataTable
    .width(400)
    .height(300)
    .dimension(pseudoCategoryDimension)
    // .size(10)
    .group(function(d) { return ''; })
    .columns([
        function(d) { return d.key; },
        function(d) { return numberFormat(d.value.grade7averageScore); },
        function(d) { return numberFormat(d.value.grade8averageScore); },
        function(d) { return numberFormat(d.value.grade9averageScore); },
        function(d) { return numberFormat(d.value.grade10averageScore); }
    ])
    .sortBy(function(d) { return -d.key; })
    .order(d3.descending);


  studentQuestionDataTable
    .width(400)
    .height(200)
    .dimension(pseudoQuestionDimension)
    // .size(10)
    .group(function(d) { return d.value.category; })
    .columns([
        function(d) { return ' * '; },
        function(d) { return d.key; },
        function(d) { return numberFormat(d.value.grade7averageScore); },
        function(d) { return numberFormat(d.value.grade8averageScore); },
        function(d) { return numberFormat(d.value.grade9averageScore); },
        function(d) { return numberFormat(d.value.grade10averageScore); }
    ])
    .sortBy(function(d) { return d.value.category; })
    .order(d3.descending);

  dc.renderAll();
}
