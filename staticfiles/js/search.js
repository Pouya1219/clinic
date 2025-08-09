// static/js/sr_search.js
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('form[data-id="1004"]');
    const searchInput = document.querySelector('input[data-id="1003"]');
    const searchResults = document.querySelector('div[data-id="1002"]');

    if (!searchForm || !searchInput || !searchResults) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = '<div class="sr_loading">در حال جستجو...</div>';

        const url = searchForm.dataset.searchUrl + '?query=' + encodeURIComponent(query);
        
        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayResults(data.data, query);
            } else {
                searchResults.innerHTML = `<div class="sr_no_results">${data.message}</div>`;
            }
        })
        .catch(error => {
            searchResults.innerHTML = '<div class="sr_no_results">خطا در جستجو</div>';
            console.error('Search error:', error);
        });
    });

    function displayResults(results, query) {
        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div class="sr_no_results">نتیجه‌ای یافت نشد</div>';
            return;
        }

        const html = results.map(patient => `
            <div class="sr_result_item" onclick="window.location.href='/Patient/detail/${patient.id}/'">
                <div class="sr_result_name">
                    ${highlightMatch(patient.name, query)}
                </div>
                <div class="sr_result_info">
                    <span class="sr_file_num">
                        شماره پرونده: ${highlightMatch(patient.file_num, query)}
                    </span>
                    ${patient.national_code ? `
                        <span class="sr_national_code">
                            کد ملی: ${highlightMatch(patient.national_code, query)}
                        </span>
                    ` : ''}
                    ${patient.contact ? `
                        <span class="sr_contact">
                            تلفن: ${highlightMatch(patient.contact, query)}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');

        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="sr_result_highlight">$1</span>');
    }

    // بستن نتایج با کلیک خارج از باکس
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // جلوگیری از submit شدن فرم
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
});
