
// var Subjects = require('./models/SubjectViews');
const pg = require('pg');
const connectionString = process.env.ASE_DATABASE_URL;


module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes

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
       'select id_human, response_date, id_question, category, question, score, grade ' +
       'from fn_get_maf_response($$SLA$$)'
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
  // res.sendfile('./public/login.html');
  res.sendfile('./public/leaderboard_student.html');
 });
}


 // app.get('/', function(req, res) {
 //     res.sendFile('path-to-file');
 // });
 // app.listen(PORT);
