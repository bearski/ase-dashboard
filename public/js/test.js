
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


d3.json("/api/scholar_word_count", function(error, data) {

  var dateFormat = d3.time.format("%Y-%m-%d");
  var numberFormat = d3.format(".2f");

  data.forEach(function (e) {
      e.dd = dateFormat.parse(e.last_update.substr(0,10));
      e.month = d3.time.month(e.dd); // pre-calculate month for better performance
  });

  console.log(data);

  // feed it through crossfilter
  var ndx = crossfilter(data);
  var all = ndx.groupAll();

  var emailDimension = ndx.dimension(function (d) {
      return d.email;
  });

  // console.log(emailDimension.top(Infinity));


  var emailGroup = emailDimension.group().reduce(
    //add
    function (p, v) {
      debug("add");
      debug(v);
      ++p.count;
      p.totalWordCount += +v.word_count;

      if (v.google_doc_id in p.doc_ids){
          // p.doc_ids[v.google_doc_id] += 1
      }
      else{
          p.doc_ids[v.google_doc_id] = 1;
          p.totalDocuments++;
      }
      return p;
    },
    //remove
    function (p, v) {
      debug("remove");
      debug(v);
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


var monthDimension = ndx.dimension(function (d) { return d.month; } );

var monthGroup = monthDimension.group().reduce(
  //add
  function (p, v) {
    ++p.count;
    p.totalWordCount += +v.word_count;
    return p;
  },
  //remove
  function (p, v) {
    --p.count;
    p.totalWordCount -= +v.word_count;
    return p;
  },
  //init
  function () {
    return {totalWordCount: 0 };
  }
);

  console.log(monthGroup.top(Infinity));

//   function ensure_group_bins(source_group) { // (source_group, bins...}
//     var bins = Array.prototype.slice.call(arguments, 1);
//     return {
//       all:function () {
//         console.log(source_group);
//         var result = source_group.all().slice(0), // copy original results (we mustn't modify them)
//         found = {};
//         result.forEach(function(d) {
//           // console.log(d.key);
//           found[d.key] = true;
//         });
//         bins.forEach(function(d) {
//           // console.log(d);
//           if(!found[d])
//             result.push({key: d, value: 0});
//         });
//         return result;
//       }
//     };
//   };
//
//
//   var quarter = ndx.dimension(function (d) {
//       var month = d.dd.getMonth();
//       if (month <= 3)
//           return "Q1";
//       else if (month > 3 && month <= 5)
//           return "Q2";
//       else if (month > 5 && month <= 7)
//           return "Q3";
//       else
//           return "Q4";
//   });
//
//   var quarterGroup = quarter.group().reduceSum(function (d) {
//       return d.totalWordCount;
//   });
//
//
// // console.log(quarterGroup.all().slice(0));
// ensure_group_bins(quarterGroup);


////////////////////////////////////////////////////////////////////////////////////////

//   var monthDimension = ndx.dimension(function (d) {
//       return d.month;
//   });
//
// // console.log(monthlyDimension.top(Infinity));
//
//   var monthGroup = monthDimension.group().reduce(
//           //add
//           function (p, v) {
//             ++p.count;
//             p.totalWordCount += +v.word_count;
//
//             if (v.google_doc_id in p.doc_ids){
//                 // p.doc_ids[v.google_doc_id] += 1
//             }
//             else{
//                 p.doc_ids[v.google_doc_id] = 1;
//                 p.totalDocuments++;
//             }
//
//             // console.log(p.doc_ids);
//
//             return p;
//           },
//           //remove
//           function (p, v) {
//               --p.count;
//               p.totalWordCount -= +v.word_count;
//
//               p.doc_ids[v.google_doc_id]--;
//               if(p.doc_ids[v.google_doc_id] === 0){
//                   delete p.doc_ids[v.google_doc_id];
//                   p.totalDocuments--;
//               }
//
//               return p;
//           },
//           //init
//           function () {
//               return {totalWordCount: 0, totalDocuments: 0, doc_ids: {} };
//           }
//   );
//
//   var minDate = monthDimension.bottom(1)[0].month;
//   var maxDate = monthDimension.top(1)[0].month;
//   var maxY = d3.max(monthGroup.all(), function(d) { return d.value.totalWordCount + d.value.totalDocuments*2; })



});
