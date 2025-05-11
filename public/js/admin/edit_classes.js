// Load provinces
fetch("/api/provinces")
  .then((response) => response.json())
  .then((provinces) => {
    const provinceSelect = document.getElementById("provinceClass");
    provinces.forEach((province) => {
      const option = document.createElement("option");
      option.value = province.name;
      option.textContent = province.name;
      if (province.name === "<%= editClass.province %>") {
        option.selected = true;
      }
      provinceSelect.appendChild(option);
    });
  });

// Load districts when province is selected
document
  .getElementById("provinceClass")
  .addEventListener("change", function () {
    const province = this.value;
    const districtSelect = document.getElementById("districtClass");
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';

    if (province) {
      fetch(`/api/districts?province=${encodeURIComponent(province)}`)
        .then((response) => response.json())
        .then((districts) => {
          districts.forEach((district) => {
            const option = document.createElement("option");
            option.value = district.name;
            option.textContent = district.name;
            if (district.name === "<%= editClass.district %>") {
              option.selected = true;
            }
            districtSelect.appendChild(option);
          });
        });
    }
  });

// Load initial districts if province is selected
const initialProvince = document.getElementById("provinceClass").value;
if (initialProvince) {
  fetch(`/api/districts?province=${encodeURIComponent(initialProvince)}`)
    .then((response) => response.json())
    .then((districts) => {
      const districtSelect = document.getElementById("districtClass");
      districts.forEach((district) => {
        const option = document.createElement("option");
        option.value = district.name;
        option.textContent = district.name;
        if (district.name === "<%= editClass.district %>") {
          option.selected = true;
        }
        districtSelect.appendChild(option);
      });
    });
}
