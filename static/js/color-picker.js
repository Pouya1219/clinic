    document.addEventListener('DOMContentLoaded', function() {
        const colorOptions = document.querySelectorAll('.patient-form-color-option');
        const selectedColorInput = document.getElementById('patient-selected-color');

        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedColorInput.value = this.dataset.color;
            });
        });
    });