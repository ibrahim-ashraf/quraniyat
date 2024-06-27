function createChallengeCode() {
  let challengeCode = "";
  let challengeCodeNumbers = Math.floor(Math.random() * 3) + 4;

  for (let i = 0; i < challengeCodeNumbers; i++) {
    challengeCode += Math.floor(Math.random() * 10);
  }

  document.getElementById("challenge-code-text").innerHTML = challengeCode;
  document.getElementById("challenge-code-hidden").value = challengeCode;

  return challengeCode;
}


function displayDateTime() {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  let dddd = days[dateTime.getDay()];
  let dd = dateTime.getDate();
  let mmmm = months[dateTime.getMonth()];
  let yyyy = dateTime.getFullYear();
  let dateText = `${dddd}، ${dd} ${mmmm} ${yyyy}`;
  let time = dateTime.toLocaleTimeString();
  document.getElementById("date_time").innerHTML = `${date}، ${time}`;

  setInterval(displayDateTime, 1000);
}