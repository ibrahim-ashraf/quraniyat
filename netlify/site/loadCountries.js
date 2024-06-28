document.addEventListener('DOMContentLoaded', loadCountries);

function loadCountries() {
  const countrySelect = document.getElementById('country-select');

  fetch('countries.json')
    .then(response => response.json())
    .then(data => {
      const countries = data.countries;
      countries.forEach(country => {
        const option = new Option(country, country);
        countrySelect.add(option);
      });
    })
    .catch(error => console.error('Error fetching countries:', error));
}