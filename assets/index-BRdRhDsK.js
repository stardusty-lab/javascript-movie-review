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
const requestAjax = async (url, config) => {
  const { method = "get", url: configUrl, params, query, data, headers } = config || {};
  let finalUrl = `${apiUrl}${configUrl || url}`;
  if (params) {
    const paramsstring = Object.values(params).join("/");
    finalUrl += `/${paramsstring}`;
  }
  if (query) {
    const querystring = new URLSearchParams(query).toString();
    finalUrl += `?${querystring}`;
  }
  const customHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...headers
  };
  const res = await fetch(finalUrl, {
    method,
    ...!!Object.values(customHeaders).filter(Boolean).length && {
      headers: {
        ...customHeaders
      }
    },
    // credentials: 'include',
    ...data && {
      body: data instanceof FormData ? data : JSON.stringify(data)
    }
  });
  let responseData;
  try {
    responseData = await res.json();
  } catch (e) {
    console.error(e);
    responseData = await res.text();
  }
  const response = {
    data: responseData,
    status: res.status,
    headers: customHeaders,
    config
  };
  if (res.ok) {
    return response;
  } else {
    throw new RequestFetchError(response);
  }
};
class RequestFetchError extends Error {
  status;
  data;
  headers;
  config;
  constructor(error) {
    super("RequestFetchError");
    this.data = error.data;
    this.status = error.status;
    this.headers = error.headers;
    this.config = error.config;
  }
}
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
const getMoviePopular = async ({
  page
}) => {
  const url = `/movie/popular`;
  const { data } = await requestAjax(url, { query: { page } });
  return {
    ...data,
    results: parseMovies(data.results)
  };
};
const getTopRatedMovie = async () => {
  const url = `/movie/top_rated`;
  const { data } = await requestAjax(url);
  return {
    ...data,
    results: parseMovies(data.results)
  };
};
const getSearchMovie = async ({
  page,
  query
}) => {
  const url = `/search/movie`;
  const { data } = await requestAjax(url, { query: { page, query } });
  return {
    ...data,
    results: parseMovies(data.results)
  };
};
const getMovieMovieId = async ({ id }) => {
  const url = `/movie/${id}`;
  const { data } = await requestAjax(url);
  return data;
};
const queryMoviePopular = () => {
  let isFetching = false;
  const refetch2 = async ({ page }) => {
    if (isFetching) return;
    isFetching = true;
    try {
      const movies = await getMoviePopular({ page });
      return movies;
    } finally {
      isFetching = false;
    }
  };
  return { refetch: refetch2 };
};
const renderTopRatedMovie = (topRatedMovie) => {
  if (!topRatedMovie) return;
  const background = document.querySelector(
    ".background-container"
  );
  if (!background) return null;
  background.style.height = "";
  const topRatedContainer = document.querySelector(".top-rated-container");
  if (!topRatedContainer) return null;
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
  const overlayImage = overlay.querySelector(".overlay img");
  if (!overlayImage) return null;
  overlayImage.style.display = "block";
  const BASE_URL = `https://media.themoviedb.org/t/p/w1920_and_h800_multi_faces`;
  const FALLBACK = "./images/no_image_large.png";
  const overlayImagePath = topRatedMovie.backdrop_path ? BASE_URL + topRatedMovie.backdrop_path : FALLBACK;
  overlayImage.src = overlayImagePath;
  overlayImage.alt = topRatedMovie.title;
  overlayImage.onerror = () => {
    overlayImage.src = FALLBACK;
  };
  const topRatedMovieElement = document.querySelector(".top-rated-movie");
  if (!topRatedMovieElement) return null;
  topRatedMovieElement.style.display = "block";
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
  background.style.height = "auto";
  const overlay = document.querySelector(".overlay");
  if (!overlay) return null;
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
  const FALLBACK = "./images/no_image.png";
  thumbnail.src = movie.poster_path ? BASE_URL + movie.poster_path : FALLBACK;
  thumbnail.onerror = () => {
    thumbnail.src = FALLBACK;
  };
  thumbnail.alt = movie.title;
  thumbnail.addEventListener("click", () => {
    handleDetail(movie.id);
  });
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
    <img src="./images/mascot.png" alt="" />
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
const MINIMUM_DISPLAY_DURATION = 600;
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
    skeleton.classList.add("animation");
    skeleton.appendChild(skeletonCloneNode);
  }
};
const removeSkeleton = (start) => {
  const skeleton = document.querySelector("#skeleton");
  if (!skeleton) return;
  const MIN_SKELETON_TIME = MINIMUM_DISPLAY_DURATION;
  const elapsed = Date.now() - start;
  const remaining = Math.max(MIN_SKELETON_TIME - elapsed, 0);
  setTimeout(() => {
    skeleton.classList.remove("animation");
    skeleton.replaceChildren();
  }, remaining);
};
const mathRound = (value, numDigits = 1) => {
  return Math.round(value * 10 ** numDigits) / 10 ** numDigits;
};
class RateLocalStroageRepository {
  #getRates() {
    const rates = localStorage.getItem("rates") || "{}";
    return JSON.parse(rates) || {};
  }
  getMovieRate(id) {
    const rates = this.#getRates();
    return rates[id];
  }
  setMovieRate(id, rate) {
    const prevRates = this.#getRates();
    const rates = { ...prevRates, [id]: rate };
    localStorage.setItem("rates", JSON.stringify(rates));
  }
}
const rateRepository = new RateLocalStroageRepository();
const renderDetailModal = (movieInfo) => {
  const modal = document.querySelector("#modal");
  if (!modal) return;
  const body = document.querySelector("body");
  if (!body) return;
  body.classList.add("modal-open");
  const detailModalTemplate = document.querySelector("#detail-modal-template");
  if (!detailModalTemplate) return;
  const cloneNode = detailModalTemplate.content.cloneNode(true);
  const rootNode = cloneNode.querySelector("#modalBackground");
  if (!rootNode) return;
  const detailModalImg = cloneNode.querySelector("#detail-modal-img");
  if (!detailModalImg) return;
  const BASE_URL = `https://media.themoviedb.org/t/p/w600_and_h900_face`;
  detailModalImg.src = BASE_URL + movieInfo.poster_path;
  detailModalImg.title = movieInfo.title;
  const detailModalTitle = cloneNode.querySelector("#detail-modal-title");
  if (!detailModalTitle) return;
  detailModalTitle.textContent = movieInfo.title;
  const detailModalCategory = cloneNode.querySelector("#detail-modal-category");
  if (!detailModalCategory) return;
  const year = new Date(movieInfo.release_date).getFullYear();
  const genres = movieInfo.genres.map((genre) => genre.name).join(", ");
  const category = `${year} · ${genres}`;
  detailModalCategory.textContent = category;
  const detailModalRate = cloneNode.querySelector("#detail-modal-rate");
  if (!detailModalRate) return;
  detailModalRate.textContent = mathRound(movieInfo.vote_average).toString();
  const rate = rateRepository.getMovieRate(movieInfo.id);
  renderRateStart(rate, rootNode);
  const detailModalDetail = cloneNode.querySelector("#detail-modal-detail");
  if (!detailModalDetail) return;
  detailModalDetail.textContent = movieInfo.overview;
  const closeModal = cloneNode.querySelector("#closeModal");
  closeModal?.addEventListener("click", () => {
    removeDetailModal();
  });
  const rateStar = rootNode.querySelectorAll("#detail-modal-star-box .star");
  Array.from(rateStar).forEach((star, index) => {
    star.addEventListener("click", () => {
      const rate2 = (index + 1) * 2;
      rateRepository.setMovieRate(movieInfo.id, rate2);
      renderRateStart(rate2, rootNode);
    });
  });
  modal.appendChild(cloneNode);
};
const renderRateStart = (rate = 0, parentNode) => {
  const rateStar = parentNode.querySelectorAll("#detail-modal-star-box .star");
  Array.from(rateStar).forEach((star, index) => {
    const isOn = rate / 2 >= index + 1;
    if (isOn) {
      star.classList.add("on");
    } else {
      star.classList.remove("on");
    }
  });
  const starMessages = {
    2: "최악이예요",
    4: "별로예요",
    6: "보통이에요",
    8: "재미있어요",
    10: "명작이에요"
  };
  if (!rate) return;
  const starMessage = parentNode.querySelector("#detail-modal-star-message");
  if (!starMessage) return;
  const message = starMessages[rate] || "";
  starMessage.textContent = message;
  const starNumber = parentNode.querySelector("#detail-modal-star-number");
  if (!starNumber) return;
  const rateMax = Math.max(...Object.keys(starMessages).map(Number));
  starNumber.textContent = `${rate.toString()}/${rateMax}`;
};
const removeDetailModal = () => {
  const modal = document.querySelector("#modal");
  if (!modal) return;
  modal.replaceChildren();
  const body = document.querySelector("body");
  if (!body) return;
  body.classList.remove("modal-open");
};
const displayErrorMessage = (message) => {
  alert(message);
};
const errorMessages = {
  INVALID_REQUEST: "잘못된 요청입니다.",
  INVALID_PAGE: "잘못된 페이지 요청입니다.",
  INVALID_SEARCH: "잘못된 검색 요청입니다.",
  UNKNOWN: "영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
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
class MovieListState {
  #total_pages;
  constructor() {
    this.#total_pages = null;
  }
  getTotalPages() {
    return this.#total_pages;
  }
  setTotalPages(total_pages) {
    this.#total_pages = total_pages;
  }
}
const { refetch } = queryMoviePopular();
const pageState = new PageState();
const movieListState = new MovieListState();
const loadInit = () => {
  const search = getSearchParams("search");
  if (search === null) {
    (async () => {
      const topRatedMovies = await errorTryCatch(
        async () => await getTopRatedMovie(),
        (e) => {
          if (e.data.status_code == 22) {
            displayErrorMessage(errorMessages.INVALID_REQUEST);
            return;
          }
          displayErrorMessage(errorMessages.UNKNOWN);
        }
      );
      const topRatedMovie = topRatedMovies.results[0];
      renderTopRatedMovie(topRatedMovie);
    })();
    (async () => {
      renderSkeleton();
      const page = pageState.getPage();
      const movies = await errorTryCatch(
        async () => await refetch({ page }),
        async (e) => {
          if (e.data.status_code == 22) {
            displayErrorMessage(errorMessages.INVALID_PAGE);
            return;
          }
          displayErrorMessage(errorMessages.UNKNOWN);
        }
      );
      if (movies) {
        movieListState.setTotalPages(movies.total_pages);
        renderMovieList(movies);
      }
      removeSkeleton(Date.now());
    })();
  } else {
    runSearch();
  }
};
const runSearch = () => {
  const search = getSearchParams("search");
  (async () => {
    const page = pageState.getPage();
    const movies = await errorTryCatch(
      async () => await getSearchMovie({
        page,
        query: search || ""
      }),
      (e) => {
        if (e.data.status_code === 22) {
          displayErrorMessage(errorMessages.INVALID_SEARCH);
          return;
        }
        displayErrorMessage(errorMessages.UNKNOWN);
      }
    );
    movieListState.setTotalPages(movies.total_pages);
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
const handleDetail = (id) => {
  (async () => {
    const movieInfo = await getMovieMovieId({ id });
    renderDetailModal(movieInfo);
  })();
};
const handleMoreMovie = async () => {
  const totalPages = movieListState.getTotalPages();
  const page = pageState.getPage();
  if (totalPages === page) return;
  pageState.increamentPage();
  const isSearchParams = hasSearchParams("search");
  if (isSearchParams) {
    runSearch();
    return;
  }
  const currentPage = pageState.getPage();
  const movies = await errorTryCatch(
    async () => await refetch({ page: currentPage }),
    async (e) => {
      if (e.data.status_code == 22) {
        displayErrorMessage(errorMessages.INVALID_PAGE);
        return;
      }
      displayErrorMessage(errorMessages.UNKNOWN);
    }
  );
  if (movies) {
    movieListState.setTotalPages(movies.total_pages);
    renderMovieList(movies);
  }
};
const errorTryCatch = async (api, errorCallback) => {
  try {
    return await api();
  } catch (e) {
    errorCallback(e);
  }
};
addEventListener("load", async () => {
  loadInit();
  document.addEventListener("scroll", () => {
    const getIsBottom = () => {
      const movieList = document.querySelector("#movie-list");
      if (!movieList) return;
      const { scrollY } = window;
      const { top, height } = movieList.getBoundingClientRect();
      const { pageYOffset } = window;
      const offsetBottom = pageYOffset + top + height;
      const windowInnerHeight = window.innerHeight;
      const isBottom = scrollY + windowInnerHeight >= offsetBottom;
      return isBottom;
    };
    if (getIsBottom()) {
      handleMoreMovie();
    }
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
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
      removeDetailModal();
    }
  });
});
