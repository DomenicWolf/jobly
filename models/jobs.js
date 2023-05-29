"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");


class Jobs {
    static async create({ title, salary, equity, companyHandle }) {
        
    
        const result = await db.query(
              `INSERT INTO jobs
               (title,salary,equity,company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING title,salary,equity,company_handle AS "companyHandle"`,
            [
              title,
              salary,
              equity,
              companyHandle
            ],
        );
        const job = result.rows[0];
    
        return job;
      }

      static async getByFilter(param,filter) {

          const paramObj = param.reduce((obj, key, index) => {
            obj[key] = filter[index];
            return obj;
          }, {});
          let {title,minSalary,hasEquity} = paramObj;
          if(hasEquity){
            hasEquity = JSON.parse(hasEquity)
          }
          let queryValues = [];
          let whereExpressions = [];
          if (minSalary !== undefined) {
              queryValues.push(minSalary);
              whereExpressions.push(`salary >= $${queryValues.length}`);
          }

        if (hasEquity !== false && hasEquity !== undefined) {
          
            
            whereExpressions.push(`equity >= .01`);
        }

        if (title) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }
        let query = `
          SELECT id,
                title,
                salary,
                equity,
                company_handle
        FROM jobs
          `;
  
        query += " WHERE " + whereExpressions.join(" AND ");
  /*
  const values = [filter[0]];

  const filtered = await db.query(query, values);
  
  return filtered.rows;*/
  query += " ORDER BY title";
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
      }


      static async findAll() {
        const jobsRes = await db.query(
              `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
               FROM jobs
               ORDER BY title`);
        
        return jobsRes.rows;
      }

      static async get(id) {
        const jobsRes = await db.query(
              `SELECT 
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);
    
        const job = jobsRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
      }


      static async update(id,data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
              title: "title",
              salary: "salary",
              equity: "equity"
            });
        const handleVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${handleVarIdx} 
                          RETURNING title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
        return job;
      }


      static async remove(id) {
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
      }
}

module.exports = Jobs;