const express = require("express");
const morgan = require("morgan");

const app = express();          

const PORT = 3010;


app.use(morgan("dev"));

let movies = [
  { id: 1, title: "Jurassic World", director: "Colin Trevorrow", year: 2015, genre: "Adventure Movie" },
  { id: 2, title: "Coco", director: "Lee Unkrich", year: 2017, genre: "Animated Movie" },
  { id: 3, title: "Dune", director: "Denis Villeneuve", year: 2021, genre: "Science Fiction" }
];

app.use(express.json());


/*
function simpleLogger(req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
}

app.use(simpleLogger);   
*/

// input validation function
function validateMovie(body, partial = false) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  if (!partial && body.title === undefined) errors.push("title is required");
  if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length === 0))
    errors.push("title must be a non-empty string");

  if (!partial && body.year === undefined) errors.push("year is required");
  if (body.year !== undefined && (!Number.isInteger(body.year) || body.year < 1888 || body.year > maximumYear))
    errors.push("year must be a valid integer");

  if (!partial && body.genre === undefined) errors.push("genre is required");
  if (body.genre !== undefined && (typeof body.genre !== "string" || body.genre.trim().length === 0))
    errors.push("genre must be a non-empty string");

  return errors;
}

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Movie data is invalid",
      details: errors
    }
  });
}


function sendNotFound(res) {
  return res.status(404).json({
    error: {
      code: "MOVIE_NOT_FOUND",
      message: "Movie not found"
    }
  });
}

// GET all

app.get("/movies", (req, res) => {
  let result = [...movies];

  // genre
  if (req.query.genre !== undefined) {
    const genreQuery = String(req.query.genre).toLowerCase();
    result = result.filter(
      m => m.genre.toLowerCase() === genreQuery
    );
  }

  // minYear
  if (req.query.minYear !== undefined) {
    const minYear = Number(req.query.minYear);
    const maxYear = new Date().getFullYear() + 5;

    if (
      Number.isNaN(minYear) ||
      !Number.isInteger(minYear) ||
      minYear < 1888 ||
      minYear > maxYear
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: "minYear must be a valid integer",
          details: [`minYear must be an integer between 1888 and ${maxYear}`]
        }
      });
    }

    result = result.filter(m => m.year >= minYear);
  }

  // sort
  if (req.query.sort !== undefined) {
    const sort = String(req.query.sort);

    if (sort === "year") {
      result.sort((a, b) => a.year - b.year);        
    } else if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title)); 
    } else {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: "Unsupported sort value",
          details: ["sort must be either 'year' or 'title'"]
        }
      });
    }
  }

  res.json(result);
});

// GET one
app.get("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const movie = movies.find(m => m.id === id);
  if (!movie) return sendNotFound(res); 
  res.json(movie);
});

//POST
app.post("/movies", (req, res) => {
  const errors = validateMovie(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Movie data is invalid",
        details: errors
      }
    });
  }

  const newId = movies.length ? Math.max(...movies.map(m => m.id)) + 1 : 1;

  const newMovie = {
    id: newId,
    title: req.body.title,
    director: req.body.director,
    year: req.body.year,
    genre: req.body.genre
  };

  movies.push(newMovie);

  res.status(201).json(newMovie);
});

// PUT
app.put("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);
  if (index === -1) return sendNotFound(res);  

  const errors = validateMovie(req.body, false);
  if (errors.length > 0) return sendValidationError(res, errors);

  movies[index] = { id, ...req.body };
  res.json(movies[index]);
});

// PATCH
app.patch("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const movie = movies.find(m => m.id === id);
  if (!movie) return sendNotFound(res); 

  const errors = validateMovie(req.body, true);
  if (errors.length > 0) return sendValidationError(res, errors);

  Object.assign(movie, req.body);
  res.json(movie);
});

// DELETE
app.delete("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);
  if (index === -1) return sendNotFound(res);  
  movies.splice(index, 1);
  res.status(200).json({ message: "Movie deleted successfully" });
});




//Error handling middleware
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route does not exist"
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred"
    }
  });
});








app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));