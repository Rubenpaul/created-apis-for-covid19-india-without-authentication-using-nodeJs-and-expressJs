const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//ADD GET States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            * 
        FROM 
            state`;
  const newState = (statesObj) => {
    return {
      stateId: statesObj.state_id,
      stateName: statesObj.state_name,
      population: statesObj.population,
    };
  };
  let stateArray = [];
  const statesArray = await db.all(getStatesQuery);
  for (let state of statesArray) {
    stateArray.push(newState(state));
  }
  response.send(stateArray);
});

//ADD GET State API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
            * 
        FROM 
            state
        WHERE 
            state_id = ${stateId}
    `;
  const newState = (statesObj) => {
    return {
      stateId: statesObj.state_id,
      stateName: statesObj.state_name,
      population: statesObj.population,
    };
  };
  const stateObj = await db.get(getStateQuery);
  const state = newState(stateObj);
  response.send(state);
});

//ADD CREATE DISTRICT API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
        INSERT  INTO 
            district (district_name, state_id, cases, cured, active, deaths) 
        VALUES (
            "${districtName}",
            "${stateId}",
            "${cases}",
            "${cured}",
            "${active}",
            "${deaths}"
        )
  `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//ADD GET District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
            * 
        FROM 
            district
        WHERE
            district_id = ${districtId}
    `;
  const convertResponseObjToDistrictObj = (districtObj) => {
    return {
      districtId: districtObj.district_id,
      districtName: districtObj.district_name,
      stateId: districtObj.state_id,
      cases: districtObj.cases,
      cured: districtObj.cured,
      active: districtObj.active,
      deaths: districtObj.deaths,
    };
  };
  const districtObj = await db.get(getDistrictQuery);
  const result = convertResponseObjToDistrictObj(districtObj);
  response.send(result);
});
//ADD DELETE District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM 
            district 
        WHERE
            district_id = ${districtId}
    `;

  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE district API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
        UPDATE 
            district
        SET  
            district_name = "${districtName}",
            state_id = "${stateId}",
            cases = "${cases}",
            cured = "${cured}",
            active = "${active}",
            deaths = "${deaths}"
        WHERE
            district_id = ${districtId}
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Stats API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM
            state NATURAL JOIN district 
        WHERE
            state_id  = ${stateId}
    `;
  const result = await db.get(getStateStatsQuery);
  response.send(result);
});

//GET district details API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
        SELECT
            state_name AS stateName
        FROM
            state NATURAL JOIN district 
        WHERE
            district_id  = ${districtId}
    `;
  const result = await db.get(getDistrictDetailsQuery);
  response.send(result);
});

module.exports = app;
