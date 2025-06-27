document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  const searchBtn = document.getElementById("searchBtn");
  const products = document.querySelectorAll(".box1");
  function filterProducts() {
    const query = searchInput.value.toLowerCase().trim();
    products.forEach(product => {
      const text = product.innerText.toLowerCase();
      if (text.includes(query)) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  }
  searchBtn.addEventListener("click", filterProducts);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      filterProducts();
    }
  });
});
