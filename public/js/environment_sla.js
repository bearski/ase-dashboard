queue()
    .defer(d3.json, "/api/maf_response_sla")
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
  var categoryRowChart = dc.rowChart("#categoryRowChart");
  var matrixDataTable = dc.dataTable("#matrixDataTable");
  var matrixQuestionDataTable = dc.dataTable("#matrixQuestionDataTable");
  // var monthBarChart = dc.barChart("#submissions-per-month");
  var questionRowChart = dc.rowChart("#questionRowChart");


  // Make sure date is parsed based on specific format (2014-04-25)
  var DTSformat = d3.time.format("%Y-%m-%d");
  var numberFormat = d3.format(".2f");

  // set up data
  data.forEach(function(d) {
    d.t = DTSformat.parse(d.sub_date.substr(0, 10));
    d.month = d3.time.month(d.t);
    d.MonthName = monthNames[d.t.getMonth()];
    if (d.grade === 7) {d.grade7Score = d.likert_value};
    if (d.grade === 8) {d.grade8Score = d.likert_value};
    if (d.grade === 9) {d.grade9Score = d.likert_value};
    if (d.grade === 10) {d.grade10Score = d.likert_value};
  });

  console.log("data");
  console.log(data);

  var ndx = crossfilter(data);
  // var totalReadings = ndx.size();
  var all = ndx.groupAll();

  // Updated version
  // dc.dataCount(".dc-data-count").dimension(ndx).group(all);

  // --- Assign Colour to Categories ---
  var colorScale = d3.scale.ordinal().domain([
      "Sense of Belonging", "Love of Learning",
      "Rigour", "Physically Conducive to Learning",
      "Culture of Reflection", "General"
    ])
    .range([
      "#66B2FF", "#B0E0E6",
      "#00FF7F", "#87CEFA",
      "#48D1CC", "#B0C4DE"
    ]);

  var categoryDim = ndx.dimension(function(d) { return d.category; });
  var categoryGroup = categoryDim.group().reduce(
    //add
    function(p,v){
      ++p.count;
      p.category = v.category;
      p.question = v.question;
      p.totalScore += +v.likert_value;
      p.averageScore = (p.totalScore/p.count);

      if (v.grade7Score) {
        ++p.grade7Count;
        p.grade7TotalScore += v.grade7Score;
        p.grade7AverageScore = (p.grade7TotalScore/p.grade7Count);
      }

      if (v.grade8Score) {
        ++p.grade8Count;
        p.grade8TotalScore += v.grade8Score;
        p.grade8AverageScore = (p.grade8TotalScore/p.grade8Count);
      }

      if (v.grade9Score) {
        ++p.grade9Count;
        p.grade9TotalScore += v.grade9Score;
        p.grade9AverageScore = (p.grade9TotalScore/p.grade9Count);
      }

      if (v.grade10Score) {
        ++p.grade10Count;
        p.grade10TotalScore += v.grade10Score;
        p.grade10AverageScore = (p.grade10TotalScore/p.grade10Count);
      }

      return p;
    },
    //remove
    function(p,v){
      --p.count;
      p.category = v.category;
      p.question = v.question;
      p.totalScore -= +v.likert_value;
      p.averageScore = (p.totalScore/p.count);

      if (v.grade7Score) {
        --p.grade7Count;
        p.grade7TotalScore -= v.grade7Score;
        p.grade7AverageScore = (p.grade7TotalScore/p.grade7Count);
      }

      if (v.grade8Score) {
        --p.grade8Count;
        p.grade8TotalScore -= v.grade8Score;
        p.grade8AverageScore = (p.grade8TotalScore/p.grade8Count);
      }

      if (v.grade9Score) {
        --p.grade9Count;
        p.grade9TotalScore -= v.grade9Score;
        p.grade9AverageScore = (p.grade9TotalScore/p.grade9Count);
      }

      if (v.grade10Score) {
        --p.grade10Count;
        p.grade10TotalScore -= v.grade10Score;
        p.grade10AverageScore = (p.grade10TotalScore/p.grade10Count);
      }

      return p;
    },
    //init
    function () {
      return {
        count: 0,
        category: "",
        question: "",
        totalScore: 0,
        averageScore: 0,
        grade7Count: 0,
        grade7TotalScore: 0,
        grade7AverageScore: 0,
        grade8Count: 0,
        grade8TotalScore: 0,
        grade8AverageScore: 0,
        grade9Count: 0,
        grade9TotalScore: 0,
        grade9AverageScore: 0,
        grade10Count: 0,
        grade10TotalScore: 0,
        grade10AverageScore: 0
      };
    }
  );


  var questionDim = ndx.dimension(function(d) { return d.question; });

  // graph updates do NOT pickup filter on their own dimension
  // setup a separate dimension we can filter on so the graph updates
  var questionFilterDim = ndx.dimension(function(d) {
    return d.question;
  });


  var questionGroup = questionDim.group().reduce(
  	//add
  	function(p,v){
  		++p.count;
  		p.category = v.category;
  		p.question = v.question;
  		p.totalScore += +v.likert_value;
  		p.averageScore = (p.totalScore/p.count);

  		if (v.grade7Score) {
  			++p.grade7Count;
  			p.grade7TotalScore += v.grade7Score;
  			p.grade7AverageScore = (p.grade7TotalScore/p.grade7Count);
  		}

  		if (v.grade8Score) {
  			++p.grade8Count;
  			p.grade8TotalScore += v.grade8Score;
  			p.grade8AverageScore = (p.grade8TotalScore/p.grade8Count);
  		}

  		if (v.grade9Score) {
  			++p.grade9Count;
  			p.grade9TotalScore += v.grade9Score;
  			p.grade9AverageScore = (p.grade9TotalScore/p.grade9Count);
  		}

  		if (v.grade10Score) {
  			++p.grade10Count;
  			p.grade10TotalScore += v.grade10Score;
  			p.grade10AverageScore = (p.grade10TotalScore/p.grade10Count);
  		}

  		return p;
  	},
  	//remove
  	function(p,v){
  		--p.count;
  		p.category = v.category;
  		p.question = v.question;
  		p.totalScore -= +v.likert_value;
  		p.averageScore = (p.totalScore/p.count);

  		if (v.grade7Score) {
  			--p.grade7Count;
  			p.grade7TotalScore -= v.grade7Score;
  			p.grade7AverageScore = (p.grade7TotalScore/p.grade7Count);
  		}

  		if (v.grade8Score) {
  			--p.grade8Count;
  			p.grade8TotalScore -= v.grade8Score;
  			p.grade8AverageScore = (p.grade8TotalScore/p.grade8Count);
  		}

  		if (v.grade9Score) {
  			--p.grade9Count;
  			p.grade9TotalScore -= v.grade9Score;
  			p.grade9AverageScore = (p.grade9TotalScore/p.grade9Count);
  		}

  		if (v.grade10Score) {
  			--p.grade10Count;
  			p.grade10TotalScore -= v.grade10Score;
  			p.grade10AverageScore = (p.grade10TotalScore/p.grade10Count);
  		}

  		return p;
  	},
  	//init
  	function () {
  		return {
  			count: 0,
  			category: "",
  			question: "",
  			totalScore: 0,
  			averageScore: 0,
  			grade7Count: 0,
  			grade7TotalScore: 0,
  			grade7AverageScore: 0,
  			grade8Count: 0,
  			grade8TotalScore: 0,
  			grade8AverageScore: 0,
  			grade9Count: 0,
  			grade9TotalScore: 0,
  			grade9AverageScore: 0,
  			grade10Count: 0,
  			grade10TotalScore: 0,
  			grade10AverageScore: 0
  		};
  	}
  );

  //var topAlarms = questionGroup.top(20)

  // FAQ to remove zero count columns.
  // https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted
  // Does NOT work in conjunction with .rowcaps() so add that functionality to it.

  function remove_empty_bins(source_group) {
    function non_zero_pred(d) {
      return d.value != 0;
    }
    return {
      all: function() {
        return source_group.all().filter(non_zero_pred);
      },
      top: function(n) {
        return source_group.top(Infinity).filter(non_zero_pred).slice(0, n);
      }
    };
  }


  var questionGroupNonZero = remove_empty_bins(questionGroup);


  var monthDim = ndx.dimension(function(d) {
    return d3.time.month(d.month);
  });


  var monthGroup = monthDim.group().reduceSum(function(d) {
    return d.likert_value;
  });

  // losing date when zooming out to max.  must be < iso <= somewhere.
  // Padding one day on xaxis to see if that helps.... that fixed it
  // figure out a better way later (Nico - 1/23/2015)  (famous last words)

  var minDate = monthDim.bottom(1)[0].month;
  // minDate.setDate(minDate.getDate() - 1);

  var maxDate = monthDim.top(1)[0].month;
  // maxDate.setDate(maxDate.getMonth() + 1);

  debug(minDate);
  debug(maxDate);


  // var uniqueDim = {
  //   top: function (num) {
  //     var seen = [];
  //     return categoryDim.top(num).filter(function (d) {
  //       var key = d.category;
  //       if (seen.indexOf(key) !== -1) {
  //         return false;
  //       } else {
  //         seen.push(key);
  //         return true;
  //       }
  //     })
  //   },
  //   bottom: function (num) {
  //     var seen = [];
  //     return categoryDim.bottom(num).filter(function (d) {
  //       var key = d.category;
  //       if (seen.indexOf(key) !== -1) {
  //         return false;
  //       } else {
  //         seen.push(key);
  //         return true;
  //       }
  //     })
  //   }
  // }
  //
  // debug("uniqueDim");
  // debug(categoryDim.top(1));
  // debug(uniqueDim.top(20));

  var pseudoCategoryDimension = {
    top: function (x) {
      return categoryGroup.top(x).map(function (grp) {
        return {"key":grp.key, "value":grp.value};
      });
    }
  };


  var pseudoQuestionDimension = {
    top: function (x) {
      return questionGroup.top(x).map(function (grp) {
        return {"key":grp.key, "value":grp.value};
      });
    }
  };


  // monthBarChart
  //   .height(150)
  //   .margins({top: 0, right: 10, bottom: 20, left: 50})
  //   .dimension(monthDim)
  //   .group(monthGroup)
  //   .centerBar(true)
  //   .gap(0)
  //   .elasticX(true)
  //   .elasticY(true)
  //   .x(d3.time.scale().domain([minDate, maxDate]))
  //   .xUnits(d3.time.months);


  categoryRowChart
    .width(200)
    .height(300)
    .margins({top: 0, right: 10, bottom: 20, left: 5})
    .dimension(categoryDim)
    .group(categoryGroup)
    .valueAccessor(function(p) { return p.value.averageScore; })
    .elasticX(false)
    .xAxis()
    .ticks(5);


  questionRowChart
    .width(400)
    .height(300)
    .margins({top: 0, right: 10, bottom: 20, left: 5})
    .dimension(questionDim)
    .group(questionGroupNonZero)
    .elasticX(true)
    .valueAccessor(function(d) { return d.value.averageScore; })
    //.rowsCap(20)
    //.othersGrouper(false)
    .ordering(function(d) { return -d.value })
    .xAxis()
    .ticks(3);

  //questionRowChart.xAxis().tickFormat(function(v) { return ""; });

  console.log(pseudoCategoryDimension.top(15));

  matrixDataTable
    .width("100pct")
    .height(200)
    .dimension(pseudoCategoryDimension)
    // .size(10)
    .group(function(d) { return "" })
    .columns([
      function(d) { return d.key; },
      function(d) { return numberFormat(d.value.grade7AverageScore); },
      function(d) { return numberFormat(d.value.grade8AverageScore); },
      function(d) { return numberFormat(d.value.grade9AverageScore); },
      function(d) { return numberFormat(d.value.grade10AverageScore); }
    ])
    // .sortBy(function(d) { return -d.key; })
    .order(d3.descending);


  matrixQuestionDataTable
    .width("100pct")
    .height(200)
    .dimension(pseudoQuestionDimension)
    // .size(10)
    .group(function(d) { return d.value.category; })
    .columns([
      function(d) { return ' * '; },
      function(d) { return d.key; },
      function(d) { return numberFormat(d.value.grade7AverageScore); },
      function(d) { return numberFormat(d.value.grade8AverageScore); },
      function(d) { return numberFormat(d.value.grade9AverageScore); },
      function(d) { return numberFormat(d.value.grade10AverageScore); }
    ])
    // .sortBy(function(d) { return -d.key; })
    .order(d3.descending);

  dc.renderAll();
}



    // function reduceAddAvg(attr) {
    //   return function(p,v) {
    //     ++p.count
    //     p.sum += v[attr];
    //     p.avg = p.sum/p.count;
    //     return p;
    //   };
    // }
    // function reduceRemoveAvg(attr) {
    //   return function(p,v) {
    //     --p.count
    //     p.sum -= v[attr];
    //     p.avg = p.sum/p.count;
    //     return p;
    //   };
    // }
    // function reduceInitAvg() {
    //   return {count:0, sum:0, avg:0};
    // }
    // var statesAvgGroup = statesAvgDimension.group().reduce(reduceAddAvg('savings'), reduceRemoveAvg('savings'), reduceInitAvg);
    // var statesAvgGroup = statesAvgDimension.group().reduce(reduceAddAvg('cost'), reduceRemoveAvg('cost'), reduceInitAvg);
