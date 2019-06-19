var LinerAppCore = function () {

  var self = this;
  var w_code;
  this.blocked = false;

  this.testLicense = function (subdomain, w_code) {
    var requestData = {subdomain: subdomain, w_code: w_code};
    var timeCurrent = new Date();
    var arrLicenseStatus = {};
    // TODO ajax request

    /*
     $.getJSON('http://terminal.linerapp.com/testLicense', JSON.stringify(requestData))
     .done(function (json){
     arrLicenseStatus = json;
     arrLicenseStatus["widgetLifeTime"] *= 1000; //php отдаёт время в секундах, мы работаем с миллисекундами
     arrLicenseStatus["w_code"] = w_code;
     });

     };

     */

    arrLicenseStatus = {
      widgetStatus: "a",
      widgetLifeTime: (new Date(timeCurrent.getTime() + 1 * 24 * 60 * 60 * 1000)),
      w_code: w_code
    };

    switch (arrLicenseStatus["widgetStatus"]) {
      case "a":
        self.blocked = false;
        arrLicenseStatus["statusLabel"] = "Работает";
        break;
      case "f":
        self.blocked = true;
        arrLicenseStatus["statusLabel"] = "Отключен";
        break;
      case "n":
        self.blocked = false;
        arrLicenseStatus["statusLabel"] = "Работает";
        break
      case "t":
        self.blocked = false;
        arrLicenseStatus["statusLabel"] = "Тестовый период";
        break;
      default:
        self.blocked = true;
        arrLicenseStatus["statusLabel"] = "Неизвестен";
    }


    return arrLicenseStatus;

  };

  this.licenseNotification = function (arrLicenseStatus, widgetName) {
    var timeCurrent = new Date(), timeHour = 60 * 60 * 1000, timeDay = timeHour * 24,
      timeTestNotificationPeriod = 2 * timeDay, //За сколько дней до окончания лицензии уведомлять
      timeActiveNotificationPeriod = 7 * timeDay,
      timeOffNotificationInterval = 8 * timeHour,  //Оповещение раз в 8 часов
      timeActiveNotificationInterval = 8 * timeHour;

    if (arrLicenseStatus["widgetStatus"] && arrLicenseStatus["widgetLifeTime"]) {

      var widgetLifeTime = arrLicenseStatus["widgetLifeTime"],
        widgetStatus = arrLicenseStatus["widgetStatus"],
        w_code = arrLicenseStatus["w_code"],
        cookieName = w_code + "_dont_disturb";

      switch (widgetStatus) {

        case "f":

          cookie = getCookie(cookieName);

          if (!cookie || !(cookie == "true")) {
            AMOCRM.notifications.show_message({
              text: "Виджет отключен, обратитесь в Liner App",
              header: widgetName
            });
            setCookie(cookieName, "true", timeOffNotificationInterval)
          }

          break;

        case "t":

          if (widgetLifeTime - timeCurrent <= timeTestNotificationPeriod) {

            cookie = getCookie(cookieName);

            if (!cookie || !(cookie == "true")) {
              AMOCRM.notifications.show_message_error({
                text: "Тестовый период закончится " + new Intl.DateTimeFormat('en-GB').format(widgetLifeTime),
                header: widgetName
              });
              setCookie(cookieName, "true", timeActiveNotificationInterval)
            }
          }

          break;

        case "a":

          if (widgetLifeTime - timeCurrent <= timeActiveNotificationPeriod) {

            cookie = getCookie(cookieName);

            if (!cookie || !(cookie == "true")) {
              AMOCRM.notifications.show_message_error({
                text: "Виджет оплачен до " + new Intl.DateTimeFormat('en-GB').format(widgetLifeTime),
                header: widgetName
              });

              setCookie(cookieName, "true", timeActiveNotificationInterval);

            }
          }

          break;

        case "n":

          break;

        default:

          AMOCRM.notifications.show_message_error({
              text: "Не удалось определить статус виджета",
              header: "Liner App"
            }
          );

      }

    } else {
      AMOCRM.notifications.show_message_error({
          text: "Не удалось получить данные от сервера",
          header: "Liner App"
        }
      );
      this.blocked = true;

    }


  }
};

function setCookie(cname, cvalue, milliseconds) {
  var d = new Date();
  d.setTime(d.getTime() + (milliseconds));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }

  return "";
}

