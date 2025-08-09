// static/js/schedules-api.js

const SchedulesAPI = {
    // دریافت توکن CSRF
    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    },
    
    // بارگذاری اطلاعات پرسنل
    loadPersonnelData(profileId) {
        return new Promise((resolve, reject) => {
            if (!profileId) {
                reject(new Error('شناسه پرسنل نامعتبر است'));
                return;
            }
            
            fetch(`${SchedulesConfig.apiEndpoints.load}${profileId}/`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        resolve(data);
                    } else {
                        reject(new Error(data.message));
                    }
                })
                .catch(error => {
                    console.error('Error loading personnel data:', error);
                    reject(error);
                });
        });
    },
    
    // ذخیره برنامه کاری
    saveSchedule(profileId, scheduleData) {
        return new Promise((resolve, reject) => {
            if (!profileId) {
                reject(new Error(SchedulesConfig.messages.selectPersonnel));
                return;
            }
            
            const formData = new FormData();
            formData.append('csrfmiddlewaretoken', this.getCsrfToken());
            formData.append('profile_id', profileId);
            formData.append('schedule_data', JSON.stringify(scheduleData));
            
            fetch(SchedulesConfig.apiEndpoints.save, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'confirm') {
                    // نیاز به تأیید کاربر برای بروزرسانی
                    resolve({ needConfirmation: true, data });
                } else {
                    resolve({ needConfirmation: false, data });
                }
            })
            .catch(error => {
                console.error('Error saving schedule:', error);
                reject(error);
            });
        });
    },
    
    // بروزرسانی برنامه کاری
    updateSchedule(profileId, scheduleData) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('csrfmiddlewaretoken', this.getCsrfToken());
            formData.append('profile_id', profileId);
            formData.append('schedule_data', JSON.stringify(scheduleData));
            
            fetch(SchedulesConfig.apiEndpoints.update, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error updating schedule:', error);
                reject(error);
            });
        });
    }
};
