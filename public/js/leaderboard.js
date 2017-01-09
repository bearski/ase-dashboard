queue()
    .defer(d3.json, "/api/scholar_word_count")
    .await(makeGraphs);
//
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


function makeGraphs(error, apiData) {
  var dateFormat = d3.time.format("%Y-%m-%d");

  apiData.forEach(function(d) {
    d.lastUpdateDate = dateFormat.parse(d.last_update.substr(0,10));
    d.month = d3.time.month(d.lastUpdateDate); // pre-calculate month
  });

  console.log(apiData);

  //
  var dataTable = dc.dataTable("#word-count-chart");
  var bubbleChart = dc.bubbleChart("#bubble-chart");


  var ndx = crossfilter(apiData);

  var emailDimension = ndx.dimension(function(d) { return d.email; });
  var emailGroup = emailDimension.group();

  var reducer = reductio()
      .count(true)
      .sum(function(d) { return +d.word_count; })
      .avg(true);

  // Now it should track count, sum, and avg.
  reducer(emailGroup);

  console.log("emailGroup");
  console.log(emailGroup.top(Infinity));


  var monthDimension = ndx.dimension(function (d) { return d.month; });
  // console.log(monthlyDimension.top(Infinity));

  var monthGroup = monthDimension.group().reduce(
    //add
    function (p, v) {
      ++p.count;
      p.totalWordCount += +v.word_count;

      if (v.google_doc_id in p.doc_ids){
        // p.doc_ids[v.google_doc_id] += 1
      }
      else {
        p.doc_ids[v.google_doc_id] = 1;
        p.totalDocuments++;
      }

      return p;
    },
    //remove
    function (p, v) {
      --p.count;
      p.totalWordCount -= +v.word_count;

      p.doc_ids[v.google_doc_id]--;
      if(p.doc_ids[v.google_doc_id] === 0){
        delete p.doc_ids[v.google_doc_id];
        p.totalDocuments--;
      }

      return p;
    },
    //init
    function () {
      return {totalWordCount: 0, totalDocuments: 0, doc_ids: {} };
    }
  );

  var minDate = monthDimension.bottom(1)[0].month;
  var maxDate = monthDimension.top(1)[0].month;
  var maxY = d3.max(monthGroup.all(), function(d) { return +d.value.totalWordCount + +d.value.totalDocuments * 2; })



  //
  dataTable
    .width(960)
    .height(800)
    .dimension(emailDimension)
    .group(function(d) { return d.student_name; })
    // .size(10)
    .columns([
      function(d) { return d.file_name; },
      function(d) { return d.word_count; },
      function(d) { return d.last_update.substr(0,10); },
    ])
    .sortBy(function(d){ return d.lastUpdateDate; });
    // .order(d3.descending);


    // dc.bubbleChart("#yearly-bubble-chart", "chartGroup")
  bubbleChart
  .width(990)
  .height(300)
  .margins({top: 10, right: 50, bottom: 30, left: 40})
  .dimension(monthDimension)
  .group(monthGroup)
  .transitionDuration(1500)
  .colors(["#a60000", "#ff0000", "#ff4040", "#ff7373", "#67e667", "#39e639", "#00cc00"])
  /*.colorDomain([-12000, 12000])*/
  .keyAccessor(function (p) { return p.key; })
  .valueAccessor(function (p) { return p.value.totalWordCount; })
  .radiusValueAccessor(function (p) { return p.value.totalDocuments; })
  .maxBubbleRelativeSize(0.3)
  .x(d3.time.scale().domain([minDate, maxDate]))
  .y(d3.scale.linear().domain([-20, maxY]))
  .r(d3.scale.linear().domain([0, 1000]))
  .elasticY(true)
  /*.yAxisPadding(100)*/
  .elasticX(true)
  /*.xAxisPadding(500)*/
  .renderHorizontalGridLines(true)
  .renderVerticalGridLines(true)
  .renderLabel(true)
  .renderTitle(true)
  .label(function (p) {
      return p.key.getFullYear();
  })
  .title(function (p) {
      return p.key
              + "\n"
              + "Number of Documents: " + p.value.totalDocuments + "\n"
              + "Total Word Count: " + p.value.totalWordCount + "\n";
  })
  .yAxis().tickFormat(function (v) {
      return v ;
  });



  // Render the Charts
  dc.renderAll();

};
