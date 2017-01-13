
var Subjects = require('./models/SubjectViews');
const pg = require('pg');
const connectionString = process.env.ASE_DATABASE_URL;


module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes
	// sample api route
 // app.get('/api/data', function(req, res) {
  // use mongoose to get all nerds in the database
  // Subjects.find({}, {'_id': 0, 'school_state': 1, 'resource_type': 1, 'poverty_level': 1, 'date_posted': 1, 'total_donations': 1, 'funding_status': 1, 'grade_level': 1}, function(err, subjectDetails) {
   // if there is an error retrieving, send the error.
       // nothing after res.send(err) will execute
 //   if (err)
 //   res.send(err);
 //    res.json(subjectDetails); // return all nerds in JSON format
 //  });
 // });

 app.get('/api/maf_response_sla', (req, res, next) => {
   const results = [];
   // Get a Postgres client from the connection pool
   pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }

     // SQL Query > Select Data
   const query = client.query(
    //  'select category, question, grade_7, grade_8, grade_9, grade_10, submission_date, user_email ' +
    //  'from fn_get_fact_maf_response( id_role => 2 )'
    //  ' from fn_fact_maf_response( id_role => 2 ) '
    // 'select distinct ' +
    // '	cr.grade::int grade, mr.date::timestamp::date sub_date, ' +
    // '	h.email, 	cat.name category, q.text_report question, ' +
    // '	l.value likert_value, cat.id id_category ' +
    // 'from   maf_response mr ' +
    // '	inner join human h on h.id = mr.id_human ' +
    // '	inner join human_classroom hcr on hcr.id_human = h.id ' +
    // '	inner join classroom cr on cr.id = hcr.id_classroom ' +
    // '	inner join maf_question q on q.id = mr.id_maf_question ' +
    // '	inner join likert_item l on l.id = mr.id_likert_item ' +
    // '	inner join maf_question_category cat on cat.id = q.id_maf_question_category ' +
    // 'where h.id_ase_role = 2 '

    'select  cat.name category, q.text_report question, coalesce(cr.grade, $$0$$)::int grade, ' +
    ' li.value likert_value, additional_answer, h.email, ' +
    ' mr.date::timestamp::date sub_date, , cat.id id_category ' +
    'from maf_response mr ' +
    '	inner join maf_question q on q.id = mr.id_maf_question ' +
    '	inner join maf_question_category cat on cat.id = q.id_maf_question_category ' +
    '	inner join human h on h.id = mr.id_human ' +
    '	left join human_classroom hcr on hcr.id_human = h.id ' +
    '	left join classroom cr on cr.id = hcr.id_classroom ' +
    '	left join likert_item li on li.id = mr.id_likert_item ' +
    'where h.id_ase_role = 2 '


     );
     // Stream results back one row at a time
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json(results);
     });
   });
 });


 app.get('/api/maf_response_student', (req, res, next) => {
   const results = [];
   // Get a Postgres client from the connection pool
   pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }

     // SQL Query > Select Data
   const query = client.query(
    'select id_human, response_date, id_question, category, question, score, grade ' +
    'from fn_get_maf_response($$Scholar$$)'
     );
     // Stream results back one row at a time
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json(results);
     });
   });
 });


 app.get('/api/scholar_word_count', (req, res, next) => {
   const results = [];
   // Get a Postgres client from the connection pool
   pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }

     // SQL Query > Select Data
     const query = client.query(
       'select student_name, email, coalesce( grade, 0) grade, section, ' +
       ' google_doc_id, last_update, file_name, word_count ' +
       'from fn_get_word_count() '
     );
     // Stream results back one row at a time
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json(results);
     });
   });
 });


  app.get('/api/scholar_khan_points', (req, res, next) => {
    const results = [];
    // Get a Postgres client from the connection pool
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }

      // SQL Query > Select Data
      const query = client.query(
        'select student_name, email, coalesce(grade, 0) grade, section,' +
        'activity_date, points ' +
        'from fn_get_khan_points()'
      );
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', () => {
        done();
        return res.json(results);
      });
    });
  });


  app.get('/api/scholar_page_count', (req, res, next) => {
    const results = [];
    // Get a Postgres client from the connection pool
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }

      // SQL Query > Select Data
      const query = client.query(
        'select student_name, email, grade, section, review_date, page_count from fn_get_page_count()'
      );
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', () => {
        done();
        return res.json(results);
      });
    });
  });

 // frontend routes =========================================================
 app.get('*', function(req, res) {
  res.sendfile('./public/login.html');
 });

}
