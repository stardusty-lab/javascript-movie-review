(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const navigate = (path) => {
  history.pushState(null, "", path);
};
const getSearchParams = (queryKey) => {
  const params = new URLSearchParams(location.search);
  return params.get(queryKey);
};
const hasSearchParams = (queryKey) => {
  const params = new URLSearchParams(location.search);
  return params.get(queryKey) === null ? false : true;
};
const apiUrl = "https://api.themoviedb.org/3";
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxOTgwNTliODA1ZDZmZjdhNzA3OGQyNDAyMWEwOGE0ZCIsIm5iZiI6MTc3NDg0MzU5My41NjQ5OTk4LCJzdWIiOiI2OWM5ZjZjOWZiZWJjZGZjMWY3MzMwNGMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.xs_0eoeh5SgBvXv3VwkCOJ5ieBHRvAAJNyVBiiAUGLg";
const isObject = (value) => {
  return value !== null && typeof value === "object";
};
const fromMovieDto = (movie) => {
  if (!isObject(movie)) return null;
  if (!("title" in movie)) return null;
  return {
    ...movie,
    poster_path: typeof movie.poster_path === "string" ? movie.poster_path : null,
    backdrop_path: typeof movie.backdrop_path === "string" ? movie.backdrop_path : null
  };
};
const parseMovies = (rawList) => {
  if (!Array.isArray(rawList)) throw new Error("Invalid data");
  return rawList.map(fromMovieDto).filter((movie) => movie !== null);
};
class ApiError extends Error {
  status_code;
  constructor(message, status_code) {
    super(message);
    this.name = "ApiError";
    this.status_code = status_code;
  }
}
const getMoviePopular = async ({
  page
}) => {
  const url = `${apiUrl}/movie/popular?page=${page}`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (res.ok) {
    const data = await res.json();
    return {
      ...data,
      results: parseMovies(data.results)
    };
  }
  const errorBody = await res.json();
  throw new ApiError(errorBody.status_message, errorBody.status_code);
};
const getTopRatedMovie = async () => {
  const url = `${apiUrl}/movie/top_rated`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await res.json();
  return {
    ...data,
    results: parseMovies(data.results)
  };
};
const getSearchMovie = async ({
  page,
  query
}) => {
  const url = `${apiUrl}/search/movie?page=${page}&query=${query}`;
  const res = await fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  const data = await res.json();
  return {
    ...data,
    results: parseMovies(data.results)
  };
};
const renderTopRatedMovie = (topRatedMovie) => {
  if (!topRatedMovie) return;
  const topRatedContainer = document.querySelector(".top-rated-container");
  if (!topRatedContainer) return null;
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
  const BASE_URL = `https://media.themoviedb.org/t/p/w1920_and_h800_multi_faces`;
  const FALLBACK = "/images/no_image_large.png";
  const backgroundImage = topRatedMovie.backdrop_path ? BASE_URL + topRatedMovie.backdrop_path : FALLBACK;
  overlay.style.backgroundImage = `url(${backgroundImage}), url(${FALLBACK}) `;
  const rateValue = topRatedContainer.querySelector(".rate-value");
  if (!rateValue) return null;
  rateValue.textContent = topRatedMovie.vote_average.toString();
  const title = topRatedContainer.querySelector(".title");
  if (!title) return null;
  title.textContent = topRatedMovie.title;
};
const removeTopRatedMovie = () => {
  const topRatedMovie = document.querySelector(".top-rated-movie");
  if (!topRatedMovie) return null;
  topRatedMovie.style.display = "none";
  const background = document.querySelector(
    ".background-container"
  );
  if (!background) return null;
  background.style.backgroundColor = "transparent";
  background.style.height = "auto";
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
  overlay.style.background = "";
  overlay.style.display = "none";
};
const renderMoreButton = () => {
  const moreButton = document.querySelector("#more-button");
  if (!moreButton) return null;
  moreButton.style.display = "block";
};
const removeMoreButton = () => {
  const moreButton = document.querySelector("#more-button");
  if (!moreButton) return null;
  moreButton.style.display = "none";
};
const createMovieNode = (movie) => {
  const movieTemplate = document.querySelector(`#movie-template`);
  if (!movieTemplate) return null;
  const movieFragment = movieTemplate.content.cloneNode(
    true
  );
  const movieItem = movieFragment.querySelector("li");
  if (!movieItem) return null;
  movieItem.dataset.movieId = String(movie.id);
  const thumbnail = movieFragment.querySelector(".thumbnail");
  if (!thumbnail) return null;
  const BASE_URL = `https://media.themoviedb.org/t/p/w220_and_h330_face`;
  const FALLBACK = "/images/no_image.png";
  thumbnail.src = movie.poster_path ? BASE_URL + movie.poster_path : FALLBACK;
  thumbnail.onerror = () => {
    thumbnail.src = FALLBACK;
  };
  thumbnail.alt = movie.title;
  const itemDesc = movieFragment.querySelector(".item-desc");
  const rate = itemDesc?.querySelector("span");
  if (!rate) return null;
  rate.textContent = movie.vote_average.toString();
  const title = itemDesc?.querySelector("strong");
  if (!title) return null;
  title.textContent = movie.title;
  return movieFragment;
};
const renderMovieList = (movies) => {
  const movieList = document.querySelector("#movie-list");
  movies.results.forEach((movie) => {
    const movieNode = createMovieNode(movie);
    if (movieNode) {
      movieList?.appendChild(movieNode);
    }
  });
  if (movies.page === movies.total_pages) {
    removeMoreButton();
  } else {
    renderMoreButton();
  }
};
const renderNoResult = () => {
  const noResult = document.querySelector("#no-result");
  if (!noResult) return;
  const empty = (
    /* html */
    `
  <p class="message-box">
    <img src="/images/mascot.png" alt="" />
    <span>검색 결과가 없습니다.</span>
  </p>`
  );
  noResult.innerHTML = empty;
  removeMoreButton();
};
const removeMovieList = () => {
  const movieList = document.querySelector("#movie-list");
  if (!movieList) return;
  const noResult = document.querySelector("#no-result");
  if (!noResult) return;
  movieList.replaceChildren();
  noResult.replaceChildren();
};
const renderSkeleton = () => {
  const skeleton = document.querySelector("#skeleton");
  if (!skeleton) return;
  const skeletonTemplate = document.querySelector("#movie-template");
  if (!skeletonTemplate) return null;
  for (let i = 0; i < 20; i++) {
    const skeletonCloneNode = skeletonTemplate.content.cloneNode(
      true
    );
    if (!skeletonCloneNode) return null;
    skeleton.appendChild(skeletonCloneNode);
  }
};
const removeSkeleton = () => {
  const skeleton = document.querySelector("#skeleton");
  if (!skeleton) return;
  skeleton.classList.add("animation");
  setTimeout(() => {
    skeleton.classList.remove("animation");
    skeleton.replaceChildren();
  }, 3e3);
};
class PageState {
  #page;
  constructor() {
    this.#page = 1;
  }
  getPage() {
    return this.#page;
  }
  increamentPage() {
    this.#page += 1;
  }
  resetPage() {
    this.#page = 1;
  }
}
const pageState = new PageState();
const runSearch = () => {
  const search = getSearchParams("search");
  (async () => {
    const page = pageState.getPage();
    const movies = await getSearchMovie({
      page,
      query: search || ""
    });
    removeTopRatedMovie();
    const movieListTitle = document.querySelector("#movie-list-title");
    if (!movieListTitle) return null;
    movieListTitle.textContent = `"${search}" 검색 결과`;
    if (movies.results.length) {
      renderMovieList(movies);
    } else {
      renderNoResult();
    }
  })();
};
const handleSearch = () => {
  const searchInput = document.querySelector("#search-input");
  if (!searchInput) return;
  const search = searchInput.value || "";
  if (!search.length) {
    searchInput.focus();
    return;
  }
  pageState.resetPage();
  navigate(`/?search=${search}`);
  removeMovieList();
  runSearch();
};
const errorTryCatch = async (api, errorCallback) => {
  try {
    return await api();
  } catch (e) {
    errorCallback(e);
  }
};
addEventListener("load", async () => {
  (async () => {
    const topRatedMovies = await getTopRatedMovie();
    const topRatedMovie = topRatedMovies.results[0];
    renderTopRatedMovie(topRatedMovie);
  })();
  (async () => {
    renderSkeleton();
    const page = pageState.getPage();
    const movies = await errorTryCatch(
      async () => await getMoviePopular({ page }),
      async (e) => {
        if (e.status_code == 22) {
          alert("잘못된 페이지 요청입니다.");
          return;
        }
        alert("영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    );
    if (movies) renderMovieList(movies);
    removeSkeleton();
  })();
  const moreButton = document.querySelector("#more-button");
  moreButton?.addEventListener("click", () => {
    pageState.increamentPage();
    const isSearchParams = hasSearchParams("search");
    if (isSearchParams) {
      runSearch();
      return;
    }
    (async () => {
      const page = pageState.getPage();
      const movies = await errorTryCatch(
        async () => await getMoviePopular({ page }),
        async (e) => {
          if (e.status_code == 22) {
            alert("잘못된 페이지 요청입니다.");
            return;
          }
          alert("영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      );
      if (movies) renderMovieList(movies);
    })();
  });
  const searchButton = document.querySelector("#search-button");
  searchButton?.addEventListener("click", () => {
    handleSearch();
  });
  const searchInput = document.querySelector("#search-input");
  if (!searchInput) return;
  searchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
});
