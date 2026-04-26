import { getMoviePopular } from "./services/api";
import { renderMovieList } from "./renders/movieList";

import { moviesFixture } from "../test/fixtures";
import { Movie } from "./services/dto";

let page = 1; // 페이지 값 저장
let totalPages: null | number; // 총 페이지 수 저장

const loadMovie = async () => {
  const movies = await getMoviePopular({ page });

  totalPages = movies.total_pages;

  renderMovieList(movies);

  return;
  // console.log('loadMovie');
  // const movies = await new Promise((resolve) => {
  //   resolve({
  //     results: moviesFixture,
  //     total_pages: 200
  //   });
  // }) as {
  //   results: Movie[],
  //   total_pages: number
  // };
      
  // totalPages = movies.total_pages;

  // renderMovieList(movies);
  // console.log("loadMovie - end");
}

const loadInit = () => {
  loadMovie();
}

const handleMoreMovie = async () => {
  if(totalPages === page) return;

  page++;

  const movies = await getMoviePopular({ page })
  
  totalPages = movies.total_pages;

  renderMovieList(movies);
  console.log("handleMoreMovie - end");
}

addEventListener("load", () => {
  loadInit();

  document.addEventListener('scroll', () => {
    console.log("scrollevent")
    const getIsBottom = () => {
      const movieList = document.querySelector<HTMLUListElement>("#movie-list");
      if(!movieList) return;

      const { scrollY } = window;

      const { top, height } = movieList.getBoundingClientRect();
      const { pageYOffset } = window;
      const offsetBottom = pageYOffset + top +  height;

      const windowInnerHeight = window.innerHeight;

      const isBottom = scrollY + windowInnerHeight >= offsetBottom;

      return isBottom;
    }

    if(getIsBottom()){
      handleMoreMovie();
    }
  });
});
