document.addEventListener('DOMContentLoaded', function() {
    // دکمه صدور کارت
    const generateBtn = document.getElementById('generateCard');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            if (confirm('آیا از صدور کارت پرسنلی اطمینان دارید؟')) {
                fetch('/api/personnel-card/generate/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        profile_id: '{{ profile.id }}'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('خطا در صدور کارت: ' + data.error);
                    }
                });
            }
        });
    }

    // دکمه تولید مجدد کارت
    const regenerateBtn = document.getElementById('regenerateCard');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            if (confirm('آیا از تولید مجدد کارت اطمینان دارید؟')) {
                fetch('/api/personnel-card/regenerate/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: JSON.stringify({
                        profile_id: '{{ profile.id }}'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('خطا در تولید مجدد کارت: ' + data.error);
                    }
                });
            }
        });
    }
});
