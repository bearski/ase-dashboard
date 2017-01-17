queue()
    .defer(d3.json, "/api/maf_response_sla")
    .await(makeGraphs);

// function round(value, decimals) {
//   return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
// }
//
// function average(dividend, divisor){
//   return (round(dividend, 2) / round(divisor, 2))
// }
//
// function formatDate(date) {
//     var d = new Date(date),
//         month = '' + (d.getMonth() + 1),
//         day = '' + d.getDate(),
//         year = d.getFullYear();
//
//     if (month.length < 2) month = '0' + month;
//     if (day.length < 2) day = '0' + day;
//
//     return [year, month, day].join('-');
// }


var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


function makeGraphs(error, apiData) {

  var dateFormat = d3.time.format("%Y-%m-%d");

  var data = [{
                  "sub_date": "2016-10-24T22:00:00.000Z",
                  "category": "Rigour",
                  "id_category": 1,
                  "question": "Scholars here are not distracted easily",
                  "likert_value": 4
              }, {
                  "sub_date": "2016-10-25T22:00:00.000Z",
                  "category": "Sense of Belonging",
                  "id_category": 2,
                  "question": "Scholars seem at-home here",
                  "likert_value": 4
              }, {
                  "sub_date": "2016-10-24T22:00:00.000Z",
                  "category": "Sense of Belonging",
                  "id_category": 2,
                  "question": "Scholars seem at-home here",
                  "likert_value": 4
              }, {
                  "sub_date": "2016-10-24T22:00:00.000Z",
                  "category": "Rigour",
                  "id_category": 1,
                  "question": "Scholars here are very self-disciplined",
                  "likert_value": 3
              }, {
                  "sub_date": "2016-11-24T22:00:00.000Z",
                  "category": "Sense of Belonging",
                  "id_category": 2,
                  "question": "Adults treat each other with respect",
                  "likert_value": 5
              }, {
                  "sub_date": "2016-10-25T22:00:00.000Z",
                  "category": "Physically Conducive to Learning",
                  "id_category": 3,
                  "question": "I do not see litter at this school",
                  "likert_value": 3
              }];


  //////////////////////////////////////////////////////////////////////////////
//   var xdata = [{
//                   "Userid": "276725",
//                   "ISBN": "034545104X",
//                   "Rating": "0"
//               }, {
//                   "Userid": "276726",
//                   "ISBN": "0155061224",
//                   "Rating": "5"
//               }, {
//                   "Userid": "276727",
//                   "ISBN": "0446520802",
//                   "Rating": "0"
//               }];
//
//   var crsfltrratings = crossfilter(xdata);
//
//   var dimisbn = crsfltrratings.dimension(function(d){return d.ISBN;});
//
//   console.log(dimisbn.top(Infinity));
//
//   var averagerating = dimisbn.group().reduce(
//       function (p,v){
//         ++p.count;
//         p.total += parseInt(v.Rating);
//         p.average = Math.floor((p.total/p.count));
//         return p;
//       },
//       function (p,v){
//         --p.count;
//         p.total -= parseInt(v.Rating);
//         p.average = Math.floor((p.total/p.count));
//         return p;
//       },
//       function (){
//         return{
//           total:0,
//           count:0,
//           average:0
//         };
//       }
//     ).all();
//
//   var expenseMetrics = d3.nest()
//     .key(function(d) { return d.value.average; })
//     .rollup(function(v) { return v.length; })
//     .entries(averagerating);
//
//   console.log(expenseMetrics);
//
//   var averageRatingGroup = {
//   all: function() {
//     var expenseMetrics = d3.nest()
//       .key(function(d) { return d.value.average; })
//       .rollup(function(v) { return v.length; })
//       .entries(averagerating.all());
//     return expenseMetrics;
//   }
// };
//
// console.log("averageRatingGroup");
// console.log(averageRatingGroup);
//
//
// var averageRatingDimension = {
//   filter: function(f) { // #1
//     if(f === null)
//       dimisbn.filter(null);
//     else throw new Error("uh oh don't know what to do here");
//   },
//   filterRange: function(r) { // #2
//     var isbns = {}; // #3
//     averagerating.all().forEach(function(kv) { // #4
//       if(r[0] <= kv.value.average && kv.value.average < r[1]) { // #5
//         isbns[kv.key] = true;
//       }
//     });
//     dimisbn.filterFunction(function(d) { // #6
//       return !!isbns[d.ISBN];
//     });
//   }
// };
//
// console.log("averageRatingDimension");
// console.log(averageRatingDimension);

  //////////////////////////////////////////////////////////////////////////////

  data.forEach(function(d) {
    d.submissionDate = dateFormat.parse(d.sub_date.substr(0,10));
    d.month = d3.time.month(d.submissionDate); // pre-calculate month for better performance
    d.monthNumber = d.submissionDate.getMonth() + 1;
    d.yearNumber = d.submissionDate.getFullYear();
    d.MonthName = monthNames[d.submissionDate.getMonth()];
  });

  console.log("data");
  console.log(data);

  var tdx = crossfilter(data);

  // console.log("tdx");
  // console.log(tdx);


  var d3_nested_data = d3.nest()
  .key(function(d) { return d.month; })
  .key(function(d) { return d.category; })
  .rollup(function(v) { return d3.mean(v, function(d) { return d.likert_value; }); })
  .entries(data);

  console.log(d3_nested_data);

  var categoryDimension = tdx.dimension(function(d) { return d.category; });
  var monthDimension = tdx.dimension(function(d) { return d.month; });

  var nestedGroup = monthDimension.group();

  var reducer = reductio()
      .count(true)
      .sum(function(d) { return +d.likert_value; })
      .avg(true)
      .nest([function(d) { return d.month; }, function(d) { return d.category; }]);

  // Now it should track count, sum, and avg.
  reducer(nestedGroup);

  console.log("nestedGroup");
  console.log(nestedGroup.top(Infinity));



  // .reduce(
  //   //add
  //   function (p, v) {
  //     p.count++;
  //     p.category = v.category;
  //     p.month = v.month;
  //     p.MonthName = v.MonthName;
  //     p.monthNumber = v.monthNumber;
  //     p.yearNumber = v.yearNumber;
  //     p.sum += v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //
  //     return p;
  //   },
  //   //remove
  //   function (p, v) {
  //     p.count--;
  //     p.category = v.category;
  //     p.month = v.month;
  //     p.MonthName = v.MonthName;
  //     p.monthNumber = v.monthNumber;
  //     p.yearNumber = v.yearNumber;
  //     p.sum -= v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //     return p;
  //   },
  //   //init
  //   function () {
  //     return { count: 0, avg: 0, sum: 0 };
  //   });




  // fake group
  // function accumulate_group(source_group) {
  //     return {
  //         all:function () {
  //             var cumulate = 0;
  //             return source_group.all().map(function(d) {
  //                 cumulate += d.value;
  //                 return {key:d.key, value:cumulate};
  //             });
  //         }
  //     };
  // }
  //
  // var accumPLGroup = accumulate_group(categoryGroup);
  // console.log(accumPLGroup);
  // fake group

  //
  // var averageRatingGroup = {
  //   all: function() {
  //     var expenseMetrics = d3.nest()
  //       .key(function(d) { return d.value.average; })
  //       .rollup(function(v) { return v.length; })
  //       .entries(averagerating.all());
  //     return expenseMetrics;
  //   }
  // };

  // var d3_nested_data = d3.nest()
  // // .key(function(d) { return d.month; })
  // .key(function(d) { return d.category; })
  // .rollup(function(v) { return d3.mean(v, function(d) { return d.likert_value; }); })
  // .entries(tdx);
  //
  // console.log("d3_nested_data");
  // console.log(d3_nested_data);
  //
  // var nested_data = d3.nest()
  // .key(function(d) { return d.value.month; })
  // .key(function(d) { return d.key; })
  // // .rollup(function(v) { return d3.mean(v, function(d) { return d.month; }); })
  // // .rollup(function(v) { return v.length; })
  // .entries(categoryGroup.all());
  //
  // console.log("nested_data");
  // console.log(nested_data);


  //////////////////////////////////////////////////////////////////////////////
  //
  // var dataTest = [
  //     {type: 'foo', a: 10, b: 9, c: 11, d: 0},
  //     {type: 'bar', a: 1, b: 4, c: 0, d: 3},
  //     {type: 'foo', a: 0, b: 2, c: 1, d: 22},
  //     {type: 'bar', a: 11, b: 5, c: 6, d: 5}
  // ];
  // var ndx = crossfilter(dataTest);
  //
  // function regroup(dim, cols) {
  //     var _groupAll = dim.groupAll().reduce(
  //         function(p, v) { // add
  //             cols.forEach(function(c) {
  //                 p[c] += v[c];
  //             });
  //             return p;
  //         },
  //         function(p, v) { // remove
  //             cols.forEach(function(c) {
  //                 p[c] -= v[c];
  //             });
  //             return p;
  //         },
  //         function() { // init
  //             var p = {};
  //             cols.forEach(function(c) {
  //                 p[c] = 0;
  //             });
  //             return p;
  //         });
  //     return {
  //         all: function() {
  //             // or _.pairs, anything to turn the object into an array
  //             return d3.map(_groupAll.value()).entries();
  //         }
  //     };
  // }
  // // we need access to the entire rows (or at least all the
  // // columns we're using), so just make the dimension function
  // // a pass-through. the keys aren't going to make much sense
  // // but we don't care.
  // var dim = ndx.dimension(function(r) { return r; });
  // var sidewaysGroup = regroup(dim, ['a', 'b', 'c', 'd']);
  //
  // var typeDim = ndx.dimension(function(r) { return r.type; });
  //
  // var sidewaysRow = dc.rowChart('#sideways-row')
  //         .width(350).height(200)
  //         .dimension(dim)
  //         .group(sidewaysGroup)
  //         .elasticX(true);
  //
  // sidewaysRow.filterHandler(function(dim, filters) {
  // 	if(filters && filters.length)
  // 		dim.filterFunction(function(r) {
  //   		return filters.some(function(c) {
  //     		return r[c] > 0;
  //    	  });
  //  	  })
  //   else dim.filterAll();
  //   return filters;
  // });
  //
  // var typePie = dc.pieChart('#type-pie')
  //         .width(400).height(400)
  //         .dimension(typeDim)
  //         .group(typeDim.group());
  //
  // dc.renderAll();

  //////////////////////////////////////////////////////////////////////////////


  // var tdxDim = tdx.dimension(function(d) { return d.yearNumber + '-' +  d.monthNumber + ':' + d.category; });
  // var tdxDim = tdx.dimension(function(d) { return +d.yearNumber +  +d.monthNumber + +d.id_category; });
  //
  // var tdxGroup = tdxDim.group().reduce(
  //   //add
  //   function (p, v) {
  //     p.count++;
  //     p.category = v.category;
  //     p.month = v.month;
  //     p.MonthName = v.MonthName;
  //     p.monthNumber = v.monthNumber;
  //     p.yearNumber = v.yearNumber;
  //     p.sum += v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //
  //     return p;
  //   },
  //   //remove
  //   function (p, v) {
  //     p.count--;
  //     p.category = v.category;
  //     p.month = v.month;
  //     p.MonthName = v.MonthName;
  //     p.monthNumber = v.monthNumber;
  //     p.yearNumber = v.yearNumber;
  //     p.sum -= v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //     return p;
  //   },
  //   //init
  //   function () {
  //     return { count: 0, avg: 0, sum: 0 };
  //   });
  //
  // var groupSize = tdxGroup.size();
  // for (var i = 0; i < groupSize; i++) {
  //     console.log(tdxGroup);
  //     //Do something
  // }

  // console.log(tdxGroup.top(Infinity));


  function sel_stack(i) {
      return function(d) {
        // console.log("i: %s, d: %s", i, d);
        // console.log(d);
        return d.value.avg;
      };
  }

  // ********************************************************************** //

  // var mychart = dc.barChart("#dc-bar-chart");
  //
  // mychart
  //   .width(420)
  //   .height(250)
  //   .margins({ top: 10, right: 50, bottom: 30, left: 40 })
  //   .brushOn(false)
  //   .clipPadding(10)
  //   .title(function(d) {
  //     // console.log(d.value.category);
  //     return (
  //       d.value.yearNumber + ' - ' +
  //       d.value.MonthName + ': ' +
  //       d.value.category + '(' +
  //       d.value.avg + ')'
  //     );
  //   })
  //   // .valueAccessor(function (p) { return p.value.avg; })
  //   .x(d3.scale.ordinal())
  //   .xUnits(dc.units.ordinal)
  //   .yAxisLabel("Average Score")
  //   .groupBars(true)
  //   .groupGap(10)
  //   .centerBar(true)
  //   .dimension(tdxDim)
  //   .group(tdxGroup, "1", sel_stack('1'))
  //   .ordering(function(d){ return d.value.monthNumber})
  //   ;

    // var x = tdxGroup.top(tdxGroup.size());
    // var arrayLength = tdxGroup.size();
    // // console.log("arrayLength = %s", arrayLength)
    // for (var i = 0; i < arrayLength; i++) {
    //     mychart.stack(tdxGroup, '' + i, sel_stack(i));
    // }


    // ********************************************************************** //

    // for(var i = 2; i < tdxGroup.size(); ++i)
    //   mychart.stack(tdxGroup, '' + i, sel_stack(i));


  //
  // apiData.forEach(function(d) {
  //   // d.submissionDate = formatDate(d.sub_date.substr(0,10));
  //   d.submissionDate = dateFormat.parse(d.sub_date.substr(0,10));
  //   d.month = d3.time.month(d.submissionDate); // pre-calculate month for better performance
  // });
  //
  // // console.log(apiData);
  //
  // var ndx = crossfilter(apiData);
  //
  //
  // var emailDimension = ndx.dimension(function(d) {
  //   return d.email;
  // });
  //
  // var emailGroup = emailDimension.group();

  // console.log(emailGroup.top(Infinity));




  // var monthDimension = ndx.dimension(function(d) {
  //   return d.month;
  // });

  // console.log(submissionDateDimension.top(Infinity));

  // var monthGroup = monthDimension.group();
  // console.log(monthGroup.top(Infinity));
  //


  //
  //
  // var categoryDimension = ndx.dimension(function(d) { return d.category; });
  //
  // var categoryGroup = categoryDimension.group().reduce(
  //   //add
  //   function (p, v) {
  //     p.count++;
  //     p.category = v.category;
  //     p.sum += v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //     return p;
  //   },
  //   //remove
  //   function (p, v) {
  //     p.count--;
  //     p.category = v.category;
  //     p.sum -= v['likert_value'];
  //     p.avg = d3.round((p.sum / p.count), 2);
  //     return p;
  //   },
  //   //init
  //   function () {
  //     return { count: 0, category: "", avg: 0, sum: 0 };
  //   });
  //
  //   var questionDimension = ndx.dimension(function(d) { return d.question; });
  //
  //   var questionGroup = questionDimension.group().reduce(
  //     //add
  //     function (p, v) {
  //       p.count++;
  //       p.question = v.question;
  //       p.sum += v['likert_value'];
  //       p.avg = d3.round((p.sum / p.count), 2);
  //       return p;
  //     },
  //     //remove
  //     function (p, v) {
  //       p.count--;
  //       p.question = v.question;
  //       p.sum -= v['likert_value'];
  //       p.avg = d3.round((p.sum / p.count), 2);
  //       return p;
  //     },
  //     //init
  //     function () {
  //       return { count: 0, question: "", avg: 0, sum: 0 };
  //     });
  //
  //   var all = ndx.groupAll();
  //
  //   // console.log(categoryGroup.top(30));
  //
  //   var categoryGroupChart = dc.rowChart("#category-chart");
  //
  //   categoryGroupChart
  //     .width(400)
  //     .height(300)
  //     .margins({ top: 5, left: 10, right: 10, bottom: 20 })
  //     .dimension(categoryDimension)
  //     .group(categoryGroup)
  //     .label(function (d) { return d.key; })
  //     .title(function (d) { return d.value.avg; })
  //     .valueAccessor(function (d) { return d.value.avg; })
  //     .elasticX(true)
  //     .xAxis().ticks(5);
  //
  //
  //     var questionGroupChart = dc.rowChart("#question-chart");
  //
  //     questionGroupChart
  //       .width(450)
  //       .height(400)
  //       .margins({ top: 5, left: 10, right: 10, bottom: 20 })
  //       .dimension(questionDimension)
  //       .group(questionGroup)
  //       .label(function (d) { return d.key; })
  //       .title(function (d) { return d.value.avg; })
  //       .valueAccessor(function (d) { return d.value.avg; })
  //       .elasticX(true)
  //       .xAxis().ticks(5);


  // var rank = function (p) { return "rank" };

  // console.log(apiData);

  //Define Dimensions
  // var gradeDimension = ndx.dimension(function(d) { return d.grade; });

  // var gradeDimension = ndx.dimension(function(d) { return d.grade + ' - ' + d.category; });
  // console.log(categoryGrade);


  // console.log(categoryGradeGroup);

  // Equivalent to reductio().avg(function(d) { return d.value; }), which sets the .sum() and .count() values.

  //
  // var questionDimension = ndx.dimension(function(d) { return d.category +' - '+ d.question; }),
  //
  //     groupedDimension = gradeDimension.group().reduce(
  //       function (p, v) {
  //         ++p.number;
  //         p.total += +v.likert_value;
  //         p.category = v.category;
  //         p.grade = v.grade;
  //         p.avg = (p.total / p.number).toFixed(2);
  //         // console.log(p);
  //         return p;
  //       },
  //       function (p, v) {
  //         --p.number;
  //         p.total -= +v.likert_value;
  //         p.category = v.category;
  //         p.grade = v.grade;
  //         p.avg = (p.number == 0) ? 0 : Math.round(p.total / p.number).toFixed(2);
  //         return p;
  //       },
  //       function () {
  //         return {number: 0, total: 0, avg: 0, category:"", grade:"", }
  //       }),
  //
  //       rank = function (p) { return "rank" };
  //
  // var gradeGroup = gradeDimension.group();

  // var categoryDimension = ndx.dimension(function(d) { return d.category; })
  // var categoryGroup = categoryDimension.group();

  // var grade7Reducer = reductio()
  //     .count(true)
  //     .sum(function(d) { return d.grade_7; })
  //     .avg(true);
  //
  // grade7Reducer(categoryGroup);





	// var gradeGroupChart = dc.rowChart("#grade-chart");



  // selectField = dc.selectMenu('#menuselect')
  //                 .dimension(categoryDimension)
  //                 .group(categoryGroup);

  // gradeGroupChart
  //   //.width(300)
  //   .height(300)
  //   .dimension(gradeDimension)
  //   .group(gradeGroup)
  //   .xAxis().ticks(4);




  dc.renderAll();


//
//   var livingThings = crossfilter([
//     // Fact data.
//     { name: "Rusty",  type: "human", legs: 2 },
//     { name: "Alex",   type: "human", legs: 2 },
//     { name: "Lassie", type: "dog",   legs: 4 },
//     { name: "Spot",   type: "dog",   legs: 4 },
//     { name: "Polly",  type: "bird",  legs: 2 },
//     { name: "Fiona",  type: "plant", legs: 0 }
//   ]);
//
//   // How many living things are in my house?
// var n = livingThings.groupAll().reduceCount().value();
// console.log("There are " + n + " living things in my house") // 6
//
// // How many total legs are in my house?
// var legs = livingThings.groupAll().reduceSum(function(fact) { return fact.legs; }).value()
// console.log("There are " + legs + " legs in my house.") // 14
//
// // Filter for dogs.
// var typeDimension = livingThings.dimension(function(d) { return d.type; });
// typeDimension.filter("dog")
//
// var n = livingThings.groupAll().reduceCount().value();
// console.log("There are " + n + " dogs in my house.") // 2
//
// var legs = livingThings.groupAll().reduceSum(function(fact) {
//   return fact.legs;
// }).value()
// console.log("There are " + legs + " dog legs in my house.") // 8
//
// // Clear the filter.
// typeDimension.filterAll()
//
//
// // How many living things of each type are in my house?
// var countMeasure = typeDimension.group().reduceCount();
// var a = countMeasure.top(4);
// console.log("There are " + a[0].value + " " + a[0].key + "(s) in my house.");
// console.log("There are " + a[1].value + " " + a[1].key + "(s) in my house.");
// console.log("There are " + a[2].value + " " + a[2].key + "(s) in my house.");
// console.log("There are " + a[3].value + " " + a[3].key + "(s) in my house.");

};

//
// function makeGraphs(error, apiData) {
//
//   var dataSet = crossfilter(apiData);
//   var dateFormat = d3.time.format("%d/%m/%Y");

//
//   var grade = ndx.dimension(function(d) { return d.grade; });
//   var gradeGroup = grade.group();
//
//   var categoryGrade = ndx.dimension(function(d) { return d.grade + '.' + d.category; });
//   var categoryGradeGroup = categoryGrade.group();
//
//
//   // Equivalent to reductio().avg(function(d) { return d.value; }), which sets the .sum() and .count() values.
//   var reducer = reductio()
//       .count(true)
//       .sum(function(d) { return d.value; })
//       .avg(true);
//
//
//   // var reducer = reductio()
//   //     .exception(function(d) { return d.id_human; })
//   //     .exceptionCount(true)
//   //     .exceptionSum(function(d) { return d.value; });
//
//   // Now it should track count, sum, and avg.
//   reducer(categoryGradeGroup);
//
//   console.log(categoryGradeGroup.top(Infinity));
//   // [ { key: 'one', value: { count: 3, sum: 10, avg: 3.3333333 },
//   //   { key: 'two', value: { count: 2, sum: 8, avg: 4 },
//   //   { key: 'three', value: { count: 1, sum: 3, avg: 3 } ]
//
//
//   //Start Transformations
//   // var dataSet = apiData;
//
//
//   // console.log('**  dataSet  **');
//   // console.log(dataSet);
//
//   // ndx.forEach(function(d) {
//     // d.date_posted = dateFormat.parse(d.date_posted);
//     // d.date_posted.setDate(1);
//     // d.value = +d.value;
// 	// });
//
//     // console.log('** dataSet  **');
//     // console.log(dataSet);
//
// // 	//Create a Crossfilter instance
// 	// var ndx = crossfilter(dataSet);
// //
// //
// 	//Define Dimensions
// // // 	var datePosted = ndx.dimension(function(d) { return d.date_posted; });
// 	var grade = ndx.dimension(function(d) { return d.grade; });
// 	var category = ndx.dimension(function(d) { return d.category; });
// // 	var surveyQuestion = ndx.dimension(function(d) { return d.text_report; });
// // 	var responseScore = ndx.dimension(function(d) { return d.value; });
// // 	var totalResponses  = ndx.dimension(function(d) { return d.total_responses; });
// //
// //
//
// var responsesByGrade = grade.group();
//
// var reducer = reductio()
//     .count(true)
//     .sum(function(d) { return d.value; })
//     .avg(true);
//
// console.log('reducer(grade)');
// console.log(reducer(grade));
// //
// //reducer(grade);
// //
// console.log(grade.top(Infinity));
//
// // //
// // // 	//Calculate metrics
// // // 	var responsesByDate = datePosted.group();
//
// 	var responsesByCategory = category.group();
// // 	var responsesBySurveyQuestion = surveyQuestion.group();
// // 	// var responsesByResponseScore = value.group();
// // // 	var stateGroup = state.group();
// // //
// 	var all = ndx.groupAll();
//
//
// // //
// // // 	//Calculate Groups
// 	// var totalResponsesGrade = grade.group().reduceSum(function(d) {
// 	// 	return d.value;
// 	// });
//
//
// //
// // 	var totalResponsesGrade = grade.group().reduceSum(function(d) {
// // 		return d.grade;
// // 	});
// //
// // 	var totalResponsesSurveyQuestion = SurveyQuestion.group().reduceSum(function(d) {
// // 		return d.funding_status;
// // 	});
// //
// // 	var nettotalResponses = ndx.groupAll().reduceSum(function(d) {return d.total_responses;});
// //
// // 	//Define threshold values for data
// // 	var minDate = datePosted.bottom(1)[0].date_posted;
// // 	var maxDate = datePosted.top(1)[0].date_posted;
// //
// // console.log(minDate);
// // console.log(maxDate);
// //
// //     //Charts
// // 	var dateChart = dc.lineChart("#date-chart");
// 	var gradeLevelChart = dc.rowChart("#grade-chart");
// // 	var CategoryChart = dc.rowChart("#resource-chart");
// // 	var SurveyQuestionChart = dc.pieChart("#funding-chart");
// 	var ResponseScoreChart = dc.rowChart("#category-chart");
// // 	var totalProjects = dc.numberDisplay("#total-projects");
// // 	var netDonations = dc.numberDisplay("#net-donations");
// // 	var stateDonations = dc.barChart("#state-donations");
// //
// //
// selectField = dc.selectMenu('#menuselect')
//                 .dimension(grade)
//                 .group(responsesByGrade);
//
// //
// //        dc.dataCount("#row-selection")
// //         .dimension(ndx)
// //         .group(all);
// //
// //
// // 	totalProjects
// // 		.formatNumber(d3.format("d"))
// // 		.valueAccessor(function(d){return d; })
// // 		.group(all);
// //
// //
// // 	netDonations
// // 		.formatNumber(d3.format("d"))
// // 		.valueAccessor(function(d){return d; })
// // 		.group(nettotalResponses)
// // 		.formatNumber(d3.format(".3s"));
// //
// //
// // 	dateChart
// // 		//.width(600)
// // 		.height(220)
// // 		.margins({top: 10, right: 50, bottom: 30, left: 50})
// // 		.dimension(datePosted)
// // 		.group(responsesByDate)
// // 		.renderArea(true)
// // 		.transitionDuration(500)
// // 		.x(d3.time.scale().domain([minDate, maxDate]))
// // 		.elasticY(true)
// // 		.renderHorizontalGridLines(true)
// //     	.renderVerticalGridLines(true)
// // 		.xAxisLabel("Year")
// // 		.yAxis().ticks(6);
// //
// //
// // 	CategoryChart
// //     //.width(300)
// //     .height(220)
// //     .dimension(Category)
// //     .group(responsesByCategory)
// //     .elasticX(true)
// //     .xAxis().ticks(5);
// //
// //
//   gradeLevelChart
//     //.width(300)
//     .height(220)
//     .dimension(grade)
//     .group(responsesByGrade)
//     .xAxis().ticks(4);
//
// 	ResponseScoreChart
// 		//.width(300)
// 		.height(220)
//     .dimension(category)
//     .group(responsesByCategory)
//     .xAxis().ticks(4);
// //
// //
//
// //
// //
// //   SurveyQuestionChart
// //     .height(220)
// //     //.width(350)
// //     .radius(90)
// //     .innerRadius(40)
// //     .transitionDuration(1000)
// //     .dimension(SurveyQuestion)
// //     .group(responsesBySurveyQuestion);
// //
// //
// //   stateDonations
// //     //.width(800)
// //     .height(220)
// //     .transitionDuration(1000)
// //     .dimension(state)
// //     .group(totalResponsesState)
// //     .margins({top: 10, right: 50, bottom: 30, left: 50})
// //     .centerBar(false)
// //     .gap(5)
// //     .elasticY(true)
// //     .x(d3.scale.ordinal().domain(state))
// //     .xUnits(dc.units.ordinal)
// //     .renderHorizontalGridLines(true)
// //     .renderVerticalGridLines(true)
// //     .ordering(function(d){return d.value;})
// //     .yAxis().tickFormat(d3.format("s"));
// //
//   dc.renderAll();
//
// };




// select
// 	cr.grade::int grade,
// 	cat.name,
// 	avg(l.value)::numeric(3,2) likert_value,
// 	count( distinct h)
// from   maf_response mr
// 	inner join human h on h.id = mr.id_human
// 	inner join human_classroom hcr on hcr.id_human = h.id
// 	inner join classroom cr on cr.id = hcr.id_classroom
// 	inner join maf_question q on q.id = mr.id_maf_question
// 	inner join likert_item l on l.id = mr.id_likert_item
// 	inner join maf_question_category cat on cat.id = q.id_maf_question_category
// where h.id_ase_role = 2
// group by 1, 2
// order by 1,2
//
//
// grade,  category,                           avg_score,  count_respondents
// 7;      "Culture of Reflection";            3.80;       4
// 7;      "General";                          4.86;       4
// 7;      "Love of Learning";                 4.62;       4
// 7;      "Physically Conducive to Learning"; 4.08;       4
// 7;      "Rigour";                           3.53;       4
// 7;      "Sense of Belonging";               4.08;       4
