import { Movie, Movies } from "../services/dto";

const createMovieNode = (movie: Movie): DocumentFragment | null => {
  const movieTemplate =
    document.querySelector<HTMLTemplateElement>(`#movie-template`);
  if (!movieTemplate) return null;

  const movieFragment = movieTemplate.content.cloneNode(
    true,
  ) as DocumentFragment;

  const movieItem = movieFragment.querySelector("li");
  if (!movieItem) return null;
  movieItem.dataset.movieId = String(movie.id);

  const thumbnail = movieFragment.querySelector<HTMLImageElement>(".thumbnail");
  if (!thumbnail) return null;

  const BASE_URL = `https://media.themoviedb.org/t/p/w220_and_h330_face`
 
  thumbnail.src = BASE_URL + movie.poster_path;

  return movieFragment;
};

export const renderMovieList = (movies: Movies): void => {
  const movieList = document.querySelector("#movie-list");

  movies.results.forEach((movie: Movie) => {
    const movieNode = createMovieNode(movie);
    if (movieNode) {
      movieList?.appendChild(movieNode);
    }
  });
};

