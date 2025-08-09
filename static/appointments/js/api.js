// static/appointments/js/api.js
class AppointmentAPI {
    static async getUnits() {
        try {
            const response = await fetch(CONFIG.API_URLS.UNITS, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });

            if (!response.ok) {
                throw new Error('خطا در دریافت لیست یونیت‌ها');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching units:', error);
            throw error;
        }
    }
    static async getCalendar() {
        try {
            const response = await fetch(CONFIG.API_URLS.APPOINTMENT_CALENDAR, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });

            if (!response.ok) {
                throw new Error('Error fetching calendar data');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching calendar:', error);
            throw error;
        }
    }
    static async getDoctors() {
        try {
            console.log('Fetching doctors from:', CONFIG.API_URLS.DOCTORS);
            const response = await fetch(CONFIG.API_URLS.DOCTORS, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Error fetching doctors list');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }
    }
static async gettreating() {
        try {
            console.log('Fetching doctors from:', CONFIG.API_URLS.TREATINGS);
            const response = await fetch(CONFIG.API_URLS.TREATINGS, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Error fetching treatings list');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }
    }

// در فایل API.js
static async getAppointmentDetails(appointmentId) {
    try {
        console.log('Fetching appointment with ID:', appointmentId);
        
        if (!appointmentId) {
            throw new Error('Appointment ID is required');
        }
        
        const response = await fetch(`/appointments/api/appointments/${appointmentId}/`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CONFIG.CSRF_TOKEN
            }
        });
        
        console.log('API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointment details');
        }
        
        const data = await response.json();
        console.log('Fetched appointment:', data);
        
        return data;
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        throw error;
    }
}


// Separate function for fetching multiple appointments
// در فایل API.js
static async getAppointments(params) {
    try {
        if (!params || !params.schedule_id || !params.start_date || !params.end_date) {
            throw new Error('Missing required parameters: schedule_id, start_date, end_date');
        }
        
        const queryString = new URLSearchParams(params).toString();
        console.log(`Request URL: /appointments/api/appointments/?${queryString}`);
        
        const response = await fetch(`/appointments/api/appointments/?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CONFIG.CSRF_TOKEN
            }
        });
        
        if (!response.ok) {
            throw new Error('خطا در دریافت نوبت‌ها');
        }
        
        const data = await response.json();
        console.log('Fetched appointments:', data);
        return data;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
    }
}



    static async updateAppointment(appointmentId, updateData) {
        // Input validation layer
        console.log("📡 [API] در  Reached updateAppointment with:", appointmentId, updateData);
        if (!appointmentId) {
            throw new Error("Appointment ID is missing.");
            }
        const validationErrors = this.validateUpdateData(updateData);
        if (validationErrors.length > 0) {
            throw {
                name: 'ClientValidationError',
                message: 'Invalid data before sending to server',
                errors: validationErrors,
                status: 400
            };
        }

        try {
            const response = await fetch(`${CONFIG.API_URLS.APPOINTMENTS}${appointmentId}/update/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                },
                body: JSON.stringify(updateData)
            });
            console.log("🚀 Sending PATCH to:", `${CONFIG.API_URLS.APPOINTMENTS}${appointmentId}/update/`);
            console.log('response in update fetch :', response)
            return await this.handleUpdateResponse(response);

        } catch (error) {
            return this.normalizeUpdateError(error);
        }
    }

    // --- Supporting Private Methods ---

    static validateUpdateData(data) {
        const errors = [];
        const ALLOWED_FIELDS = new Set([
            'first_name', 'last_name', 'national_code', 'phone',
            'treatment_type', 'treatment_description', 'referral',
            'description', 'status', 'visited', 'no_file',
            'unit', 'treating_doctor'
        ]);

        // Field existence check
        for (const field in data) {
            if (!ALLOWED_FIELDS.has(field)) {
                errors.push({
                    field,
                    code: 'invalid_field',
                    message: `${field} is not updatable`
                });
            }
        }

        // Business rule validation
        if (data.status === 'completed' && !data.treatment_type) {
            errors.push({
                field: 'treatment_type',
                code: 'required_when_completed',
                message: 'Treatment type required when marking as completed'
            });
        }

        return errors;
    }

    static prepareUpdatePayload(rawData) {
        // Clone to avoid modifying original
        const payload = {...rawData};

        // Transformations
        if (payload.phone) {
            payload.phone = payload.phone.replace(/[^\d+]/g, '');
        }

        if (payload.unit && typeof payload.unit !== 'number') {
            payload.unit = payload.unit.id; // Extract ID if object passed
        }

        return payload;
    }

    static async handleUpdateResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            console.log("Update failed");
            throw {
                name: this.getErrorTypeByStatus(response.status),
                message: data.message || 'Update failed',
                errors: data.errors || {},
                status: response.status,
                responseData: data
            };
        }

        return {
            success: true,
            data,
            meta: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys(data.updated_fields || {})
            }
        };
    }

    static getErrorTypeByStatus(status) {
        const errorTypes = {
            400: 'ValidationError',
            401: 'AuthError',
            403: 'PermissionError',
            404: 'NotFoundError',
            500: 'ServerError'
        };
        return errorTypes[status] || 'ApiError';
    }

    // static logUpdateError(error, appointmentId, payload) {
    //     Sentry.captureException(error, {
    //         tags: { service: 'AppointmentService' },
    //         extra: {
    //             appointmentId,
    //             payload,
    //             errorType: error.name,
    //             statusCode: error.status
    //         }
    //     });

    //     console.groupCollapsed('Appointment Update Failure');
    //     console.error('Appointment ID:', appointmentId);
    //     console.error('Error:', error.name, error.message);
    //     console.error('Status:', error.status);
    //     console.error('Payload:', payload);
    //     console.error('Stack:', error.stack);
    //     console.groupEnd();
    // }

    static normalizeUpdateError(error) {
        // For network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return {
                success: false,
                error: {
                    name: 'NetworkError',
                    message: 'Cannot connect to server',
                    status: 0,
                    retryable: true
                }
            };
        }

        // For our structured errors
        return {
            success: false,
            error: {
                name: error.name || 'UpdateError',
                message: error.message || 'Update operation failed',
                status: error.status || 500,
                errors: error.errors || null,
                retryable: this.isRetryableError(error)
            }
        };
    }

    static isRetryableError(error) {
        return [0, 502, 503, 504].includes(error.status || 0);
    }


    static async getDoctorSchedule(scheduleId) {
        try {
            const response = await fetch(CONFIG.API_URLS.SCHEDULE(scheduleId), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });

            if (!response.ok) {
                throw new Error('Error fetching doctor schedule');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching schedule:', error);
            throw error;
        }
    }

   

    static async saveAppointment(data) {
        try {
            console.log('Sending appointment data:', data);
            const response = await fetch(CONFIG.API_URLS.SAVE_APPOINTMENT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                },
                body: JSON.stringify(data)
            });

            console.log('Save response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error saving appointment');
            }

            const responseData = await response.json();
            console.log('Save response data:', responseData);
            return responseData;
        } catch (error) {
            console.error('Error saving appointment:', error);
            throw error;
        }
    }

    static async deleteAppointment(appointmentId) {
        try {
            const response = await fetch(CONFIG.API_URLS.DELETE_APPOINTMENT(appointmentId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CONFIG.CSRF_TOKEN
                }
            });

            if (!response.ok) {
                throw new Error('Error deleting appointment');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }  

static async searchPatient(query) {
    try {
        const response = await fetch(`/appointments/api/patient/search/?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw await response.json();
        }

            const result = await response.json();
        return result;

    } catch (error) {
        console.error("❌ خطا در جستجوی بیمار:", error);
        return { status: 'error', message: 'در دریافت اطلاعات بیمار مشکلی پیش آمد.' };
    }
}
static async getTreatmentTypes() {
     try {
            const response = await fetch('/appointments/api/treatment/types/',{
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json'
                    }
            });
                if (!response.ok) {
            throw await response.json();
        }

            const result = await response.json();
        return result;

    } catch (error) {
        console.error("❌ خطا در جستجوی بیمار:", error);
        return { status: 'error', message: 'در دریافت اطلاعات بیمار مشکلی پیش آمد.' };
    }
}

static async getTreatmentDetailsByType(typeId) {
        try {
                const response = await fetch(`/appointments/api/treatment/details/?type_id=${typeId}`, {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json'
                    }
            });
                if (!response.ok) {
            throw await response.json();
        }

            const result = await response.json();
        return result;

    } catch (error) {
        console.error("❌ خطا در جستجوی بیمار:", error);
        return { status: 'error', message: 'در دریافت اطلاعات بیمار مشکلی پیش آمد.' };
    }
}
}


