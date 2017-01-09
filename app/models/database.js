const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const client = new pg.Client(connectionString);
client.connect();
const query = client.query(
  'select cr.grade::int grade, id_maf_question_category, cat.name category, ' +
  ' q.id id_maf_question, q.text_report, l.value ' +
  'from   maf_response mr ' +
  ' inner join human h on h.id = mr.id_human ' +
  ' inner join human_classroom hcr on hcr.id_human = h.id ' +
  ' inner join classroom cr on cr.id = hcr.id_classroom ' +
  ' inner join maf_question q on q.id = mr.id_maf_question ' +
  ' inner join maf_question_category cat on cat.id = q.id_maf_question_category ' +
  ' inner join likert_item l on l.id = mr.id_likert_item ' +
  'where h.id_ase_role = 2'
);
query.on('end', () => { client.end(); });
