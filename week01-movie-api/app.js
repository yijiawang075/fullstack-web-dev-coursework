const express = require("express");

const app = express();

const PORT = 3010;

let movies = [
  {
    id: 1,
    title: "Jurassic World",
    director: "Colin Trevorrow",
    year: 2015
  },
  {
    id: 2,
    title: "Coco",
    director: "Lee Unkrich",
    year: 2017
  },
  {
    id: 3,
    title: "Dune",
    director: "Denis Villeneuve",
    year: 2021
  }
];

app.use(express.json());

app.get("/movies", (req, res) => {
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });
  res.json(movie);
});

app.post("/movies", (req, res) => {
  const { title, director, year } = req.body;
  const newMovie = { 
    id: movies.length + 1,
    title:req.body.title, 
    director:req.body.director,   
    year:req.body.year
  };
  if(!req.body.title||!req.body.director||!req.body.year){
    return res.status(400).json({ error: "Title, director, and year are required" });
  }
  movies.push(newMovie);
  res.status(201).json(newMovie);
    });
        

app.patch("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });   
  
  const { title, director, year } = req.body;
  if (title) movie.title = title;
  if (director) movie.director = director;
  if (year) movie.year = year;
  res.json(movie);
});

app.delete("/movies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const movieIndex = movies.findIndex(m => m.id === id);
  if (movieIndex === -1) return res.status(404).json({ error: "Movie not found" });
  movies.splice(movieIndex, 1);
  res.status(200).json({ message: "Movie deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});