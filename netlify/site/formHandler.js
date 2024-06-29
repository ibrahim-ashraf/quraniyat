function handleFormSubmission(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  fetch('/.netlify/functions/saveFormData', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(result => {
      alert(result.message);
      // يمكنك هنا إضافة المزيد من الإجراءات، مثل إعادة توجيه المستخدم أو تنظيف النموذج
    })
    .catch(error => {
      console.error('Error:', error);
      alert('حدث خطأ أثناء إرسال البيانات');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[name="register"]');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
});