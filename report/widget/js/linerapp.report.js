function linerAppReport() {

  var self = this;
  var twig = require('twigjs');
  var server = "https://terminal.linerapp.com";
  this.app = {
    select: false,
    countPays: false,
    pays: [],
    wrapper: false,
    table: false,
    loader: false
  };
  this.data = {
    currentType: false,
    countPays: false,
    pays: {
      rate: [],
      payment: [],
      rest: [],
      success: []
    },
    price: false,
    types: false,
    setting: false
  };

  this.form = {
    pipelines: {},
    wrapper: false,
    types: {}
  };


  this.numb = function(data) {
    data = (data - 0);
    return data.toFixed(3);
  };

  this.price = function() {
    this.data.price = AMOCRM.data.current_card.model.attributes['lead[PRICE]'] - 0;
  };

  this.html = {

    style: '<style>.linerapp-table tbody tr:nth-child(3) > td {padding-bottom: 10px;} .linerapp-table .item-title { padding: 20px 0 15px; border-top: 2px solid #4d85e6;} .linerapp-table {width: 100%;}.linerapp-table tbody + tbody {}.linerapp-table tr td:nth-child(2) label {box-sizing: border-box;display: block;padding-left: 25px;width: 100%;} .linerapp-table td {vertical-align: middle;width: 50%;padding: 10px 0;}.linerapp-table label b {display: block;margin-bottom: 5px;} .linerapp-report-setting-table {width: 100%;}.linerapp-report-setting .item-pipeline {border: 2px solid #4C8BF7;padding: 15px;}.linerapp-report-setting .title {font-size: 18px;font-weight: 600;margin-bottom: 15px;text-align: center;}.linerapp-report-setting .field > label {display: block;margin: 10px 0;}.linerapp-report-setting .item-pipeline + .item-pipeline {margin-top: 15px;}</style>',
    wrapper: '<div class="linerapp-report"></div>',
    table: '<table class="linerapp-table"></table>',
    loader: '<div class="default-overlay widget-settings__overlay default-overlay-visible" id="service_overlay" style="z-index: 1111"><span class="spinner-icon expanded spinner-icon-abs-center" id="service_loader"></span></div>',
    // метод добавления нового элемента платежа
    paymentItem: function(inc) {
      var rateHide = self.data.currentType !== 'Процентная' ? ' style=" display: none;"' : '';
      var rowShow = self.data.currentType !== 'Процентная' ? ' rowspan="2"' : '';
      var readonlyShow = self.data.currentType === 'Процентная' ? ' style="background-color: #efefef;" readonly=""' : '';
      var html = '<tbody data-item-pay="' + inc + '"><tr><td class="item-title" colspan="2">Платеж №' + inc + '</td></tr><tr>\
      <td' + rowShow + '><label><b>Сумма платежа:</b><input' + readonlyShow + ' data-num-pay="' + inc + '" class="cf-field-input text-input input-payment" value="' + self.numb(self.data.pays.payment[(inc - 1)].val() - 0) + '"/></label></td><td>\
      <label><b>Оплачено:</b><input data-num-pay="' + inc + '" class="cf-field-input text-input input-success" value="' + self.numb(self.data.pays.success[(inc - 1)].val() - 0) + '"/></label></td></tr><tr>\
      <td' + rateHide + '><label><b>Процент:</b><input data-num-pay="' + inc + '" class="cf-field-input text-input input-rate" value="' + self.data.pays.rate[(inc - 1)].val() + '"/></label></td><td>\
      <label><b>Остаток:</b><input style="background-color: #efefef;" readonly="" data-num-pay="' + inc + '" class="cf-field-input text-input input-rest" value="' + self.numb(self.data.pays.rest[(inc - 1)].val() -0 )+ '"/> </label></td></tr></tbody>';
      if ($('tbody[data-item-pay="' + inc + '"]').length < 1) {
        $(html).appendTo(self.app.table);
      }
    },
    itemPipeline: function(data) {
      console.log(data);
      var arTypes = {},
          iStatus;
      for (var i in self.data.types) {
        arTypes[i] = {
          id: i,
          option: self.data.types[i].name
        }
      }


      var arTypes_1 = {};
      if (typeof self.data.setting[data.id] != 'undefined' && typeof self.data.setting[data.id].types_1 != 'undefined') {
          for (iStatus in arTypes) {
            if (typeof self.data.setting[data.id].types_1[iStatus] != 'undefined') {
              arTypes_1[iStatus] = {
                id: iStatus,
                option: arTypes[iStatus].option,
                is_checked: true
              };
            } else {
              arTypes_1[iStatus] = {
                id: iStatus,
                option: arTypes[iStatus].option
              };
            }
          }
      } else {
        arTypes_1 = arTypes;
      }

      var listTypes_1 = twig({ref: '/tmpl/controls/checkboxes_dropdown.twig'}).render({
        items: arTypes_1,
        class_name: 'linerapp-report',
        id: 'types_1-' + data.id,
        name: 'types_1[' + data.id + '][]'
      });


      var arTypes_2 = {};
      if (typeof self.data.setting[data.id] != 'undefined' && typeof self.data.setting[data.id].types_2 != 'undefined') {
          for (iStatus in arTypes) {
            if (typeof self.data.setting[data.id].types_2[iStatus] != 'undefined') {
              arTypes_2[iStatus] = {
                id: iStatus,
                option: arTypes[iStatus].option,
                is_checked: true
              };
            } else {
              arTypes_2[iStatus] = {
                id: iStatus,
                option: arTypes[iStatus].option
              };
            }
          }
      } else {
        arTypes_2 = arTypes;
      }

      var listTypes_2 = twig({ref: '/tmpl/controls/checkboxes_dropdown.twig'}).render({
        items: arTypes_2,
        class_name: 'linerapp-report',
        id: 'types_2-' + data.id,
        name: 'types_2[' + data.id + '][]'
      });


      var arStatuses = {};
      if (typeof self.data.setting[data.id] != 'undefined' && typeof self.data.setting[data.id].statuses != 'undefined') {
          for (iStatus in data.statuses) {
            if (typeof self.data.setting[data.id].statuses[iStatus] != 'undefined') {
              arStatuses[iStatus] = {
                id: iStatus,
                option: data.statuses[iStatus].option,
                is_checked: true
              };
            } else {
              arStatuses[iStatus] = {
                id: iStatus,
                option: data.statuses[iStatus].option
              };
            }
          }
      } else {
        arStatuses = data.statuses;
      }
      var listStatuses = twig({ref: '/tmpl/controls/checkboxes_dropdown.twig'}).render({
        items: arStatuses,
        class_name: 'linerapp-report',
        id: 'statuses-' + data.id,
        name: 'statuses[' + data.id + '][]'
      });


      var html = '<div class="item-pipeline"><div class="title">' + data.name + '</div>\
          <div class="field"><label>Статусы:</label><div class="content-statuses">' + listStatuses + '</div></div>\
          <div class="field"><label>Типы документов "Обмерочник":</label><div class="content-types-1">' + listTypes_1 + '</div></div>\
          <div class="field"><label>Типы документов "Платежка":</label> <div class="content-types-2">' + listTypes_2 + '</div></div></div>';
      $(html).appendTo(self.form.wrapper);
    }

  };

  /**
   * Функция инициализации приложения
   */
  this.initCard = function() {

    this.data.price = AMOCRM.data.current_card.model.attributes['lead[PRICE]'] - 0;
    this.app.select = $("span:contains('Схема оплаты')").parent("div").next(".linked-form__field__value").find("input");
    this.data.currentType = $(this.app.select).prev("button").find("span").html();
    this.app.select.change(function() {
      self.data.currentType = $('li[data-value="' + $(this).val() + '"]').find("span").html();
      self.reNumbers();
      self.render(); // Выполняем отрисовку
    });

    this.app.countPays = $("span:contains('Количество платежей')").parent("div").next(".linked-form__field__value").find("input");
    this.data.countPays = $(this.app.countPays).prev("button").find("span").html() - 0;
    this.app.countPays.change(function() {
      self.data.countPays = $('li[data-value="' + $(this).val() + '"]').find("span").html() - 0;
      self.reNumbers();
      self.render(); // Выполняем отрисовку
    });


    this.reNumbers();
    $(this.html.style).appendTo("head");
    this.app.wrapper = $(this.html.wrapper).insertBefore(this.app.pays[(this.app.pays.length - 1)].success);
    this.app.table = $(this.html.table).appendTo(this.app.wrapper);
    this.render(); // Выполняем отрисовку

  };


  /**
   * Перерасчет полей
   */
  this.reNumbers = function() {
    for (var i = 0; i < 10; i++) {
      this.app.pays[i] = {};
      if ($("span:contains('Процент " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric").length > 1) {
        this.app.pays[i].rate = $($("span:contains('Процент " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric")[1]).hide();
        this.app.pays[i].payment = $($("span:contains('Платеж " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric")[1]).hide();
        this.app.pays[i].rest = $($("span:contains('Остаток " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric")[1]).hide();
        this.app.pays[i].success = $($("span:contains('Оплачено " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric")[1]).hide();
      } else {
        this.app.pays[i].rate = $("span:contains('Процент " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric").hide();
        this.app.pays[i].payment = $("span:contains('Платеж " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric").hide();
        this.app.pays[i].rest = $("span:contains('Остаток " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric").hide();
        this.app.pays[i].success = $("span:contains('Оплачено " + (i + 1) + "')").parents(".linked-form__field.linked-form__field-numeric").hide();
      }
      this.data.pays.rate[i] = this.app.pays[i].rate.find(".linked-form__field__value input");
      this.data.pays.payment[i] = this.app.pays[i].payment.find(".linked-form__field__value input");
      this.data.pays.rest[i] = this.app.pays[i].rest.find(".linked-form__field__value input");
      this.data.pays.success[i] = this.app.pays[i].success.find(".linked-form__field__value input");
    }
  };


  /**
   * Отрисовка элементов
   */
  this.render = function() {
    if (this.data.currentType === 'Фиксированная' || this.data.currentType === 'Процентная') {
      var allItems = $('.linerapp-table tbody').length;
      if (this.data.countPays < allItems) {
        for (var inc = allItems; inc > this.data.countPays; inc--) {
          self.data.pays.rate[(inc - 1)].val("");
          self.data.pays.payment[(inc - 1)].val("");
          self.data.pays.rest[(inc - 1)].val("");
          self.data.pays.success[(inc - 1)].val("");
        }
      }

      $('.linerapp-table').html('');
      if (this.data.countPays > 0) {
        for (var i = 0; i < this.data.countPays; i++) {
          self.html.paymentItem((i + 1));
        }
      }
      this.changer();
    }
  };


  /**
   * Отслеживание изменений в форме
   */
  this.changer = function() {
    $(".input-payment, .input-success, .input-rate, .input-rest").unbind("change");

    $(".input-payment").change(function() {
      var id = $(this).attr('data-num-pay') - 1;
      var val = $(this).val();
      self.data.pays.payment[id].val(self.numb(val));
      self.data.pays.payment[id].change();
      var rest = (val - ($(".input-success[data-num-pay='" + (id + 1) + "']").val() - 0));
      $(".input-rest[data-num-pay='" + (id + 1) + "']").val(self.numb(rest));
      self.data.pays.rest[id].val(self.numb(rest));
      self.data.pays.rest[id].change();
      console.log("change payment: " + id);
      console.log(self.data.pays);
      self.cycleFixedSum();
    });

    $(".input-success").change(function() {
      var id = $(this).attr('data-num-pay') - 1;
      var val = $(this).val();
      self.data.pays.success[id].val(self.numb(val));
      self.data.pays.success[id].change();

      var rest = (($(".input-payment[data-num-pay='" + (id + 1) + "']").val() - 0) - val);
      $(".input-rest[data-num-pay='" + (id + 1) + "']").val(self.numb(rest));
      self.data.pays.rest[id].val(self.numb(rest));
      self.data.pays.rest[id].change();
      self.cycleFixedSum();
    });

    $(".input-rate").change(function() {
      var id = $(this).attr('data-num-pay') - 1;
      var val = $(this).val() - 0;
      self.data.pays.rate[id].val(val);
      self.data.pays.rate[id].change();
      self.price();
      if (self.data.price < 1) {
        AMOCRM.notifications.show_message_error({
          text: 'Не задано поле "Бюджет" в сделке', header: "Ошибка"
        });
      } else {

        var iSuccess = self.data.pays.success[id].val() - 0;
        $(".input-payment[data-num-pay='" + (id + 1) + "']").val(self.data.price * (val / 100));
        self.data.pays.payment[id].val(self.data.price * (val / 100));
        $(".input-rest[data-num-pay='" + (id + 1) + "']").val((self.data.pays.payment[id].val() - 0) - iSuccess);
        self.data.pays.rest[id].val((self.data.pays.payment[id].val() - 0) - iSuccess);
      }
      self.cycleFixedSum();
    });

    $(".input-rest").change(function() {
      var id = $(this).attr('data-num-pay') - 1;
      self.data.pays.rest[id].val(self.numb($(this).val()));
      self.data.pays.rest[id].change();
      self.cycleFixedSum();
    });

  };


  this.cycleFixedSum = function() {
    $(".input-payment, .input-success, .input-rest").each(function() {
      var val = $(this).val() - 0;
      $(this).val(self.numb(val));
    });

  };

  this.download = function() {

    var user = AMOCRM.constant('user').id,
        subdomain = AMOCRM.constant('account').subdomain;

  };


  /**
   * Загрузка воронок и статусов
   */
  this.getPipelines = function(callback) {
    $.get("/api/v2/pipelines", function(data) {
      for (var key in data._embedded.items) {
        self.form.pipelines[key] = {
          name: data._embedded.items[key].name,
          id: key,
          statuses: {},
          render: false
        };
        var i = 0;
        for (var idStatus in data._embedded.items[key].statuses) {
          if (idStatus != 143 && idStatus != 142) {
            self.form.pipelines[key].statuses[idStatus] = {
              id: idStatus,
              option: data._embedded.items[key].statuses[idStatus].name
            };
            i++;
            self.form.pipelines[key].render = twig({ref: '/tmpl/controls/checkboxes_dropdown.twig'}).render({
              items: self.form.pipelines[key].statuses,
              class_name: 'linerapp-report',
              id: '',
              name: 'pipeline[' + key + ']'
            });
          }
        }
      }
      self.renderSetting();
      if (typeof callback !== 'undefined' && callback) {
        callback();
      }
    });
  };

  /**
   * Получение общих настроек для воронок
   */
  this.getSetting = function() {
    var subdomain = AMOCRM.constant('account').subdomain;
    $.getJSON(server + '/report/get/' + subdomain, function(data) {
      self.data.setting = data;
      self.getTypes();
    });
  };

  /**
   * Запрос списка достпных типов файлов
   */
  this.getTypes = function() {
    $.getJSON(server + '/docs/get/types/' + AMOCRM.constant('account').subdomain, function(data) {
      self.data.types = data;
      self.getPipelines();
    });
  };

  /**
   * Отрисовка таблицы воронок
   */
  this.renderSetting = function() {
    $(this.html.style).appendTo("head");
    console.log("init render setting");

    this.form.wrapper = $('<form class="linerapp-report-setting"></form>').prependTo(".widget_settings_block__fields");
    $("<input type='hidden' name='subdomain' value='" + AMOCRM.constant('account').subdomain + "'/>").appendTo(this.form.wrapper);
    for (var key in this.form.pipelines) {
      self.html.itemPipeline(this.form.pipelines[key]);
    }
    this.app.loader.remove();
    this.app.loader = false;
  };


  /**
   * Инициализация настроек виджета
   */
  this.initSetting = function() {
    this.app.loader = $(this.html.loader).appendTo("body");
    this.getSetting();
  };

  /**
   * Сохранение настроек
   */
  this.saveSetting = function() {
    var data = $(".linerapp-report-setting").serializeArray();
    $.ajax({
      type: "POST",
      url: server + '/report/set',
      dataType: "json",
      data: data,
      success: function(mes) {
        if (typeof mes.error != 'undefined') {
          AMOCRM.notifications.show_message_error({text: mes.error, header: "Ошибка"});
        } else {
          AMOCRM.notifications.show_message_error({text: mes.success, header: "Успех"});
        }
      }
    });
  };


  // end class
}
var obLinerAppReport = new linerAppReport();