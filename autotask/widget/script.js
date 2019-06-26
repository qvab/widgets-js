define(['jquery', 'lib/components/base/modal', './js/core.js'], function($, Modal) {
  var CustomWidget = function() {
    var self = this;
    var pipelines = [];
    var responsible = [];
    var task_types = [];
    var statuses = {};
    var server = "https://terminal.linerapp.com";
    var hashServer = false;
    var w_code;
    var objCore = new LinerAppCore();
    self.getTemplate = function(template, params, callback) {
      params = (typeof params == 'object') ? params : {};
      template = template || '';

      return self.render({
        href: '/templates/' + template + '.twig',
        base_path: self.params.path,
        load: callback
      }, params);
    };

    this.getServerUrl = function() {
      var serverUrl = 'https://terminal.linerapp.com/linerapp/index.php';
      return serverUrl;
    };


    this.statusInterval = function() {
      function testChenge() {
        var days = $('.linerapp-autotask-widget input[name="date_days"]').val(),
            hours = $('.linerapp-autotask-widget input[name="date_hours"]').val(),
            min = $('.linerapp-autotask-widget input[name="date_min"]').val();

        if (!days && !hours && !min) {
          $(".linerapp-autotask-schedule").removeClass("readonly").attr("data-status", "active");
        } else {
          if ($(".linerapp-autotask-schedule").attr("data-status") == "active") {
            $(".linerapp-autotask-schedule").addClass("readonly").attr("data-status", "block");
          }
        }
      }
      testChenge();
      $('.linerapp-autotask-widget input[name="date_days"], .linerapp-autotask-widget input[name="date_hours"], .linerapp-autotask-widget input[name="date_min"]').change(function() {
        testChenge();
      });
    };


    this.focusInterval = function() {
      $('.linerapp-autotask-widget input[name="date_days"], .linerapp-autotask-widget input[name="date_hours"], .linerapp-autotask-widget input[name="date_min"]').focus(function() {
        if ($('input[name="schedule[]"]:checked').length > 0) {
          alert("Вы не можете выбрать постановку задачи по произвольному периоду, если уже выбрали постановку по дням недели");
          $(this).blur();
        }
      });
    };

    this.selectedInterval = function() {
      var days = $('.linerapp-autotask-widget input[name="date_days"]').val(),
          hours = $('.linerapp-autotask-widget input[name="date_hours"]').val(),
          min = $('.linerapp-autotask-widget input[name="date_min"]').val();
      var countSchedule = $('input[name="schedule[]"]:checked').length;
      if (countSchedule < 1 &&
          (
              !days && !hours && !min
          )
      ) {
        return false;
      }
      return true;
    };


    this.notifications = function(header, message, wait_time) {
      var inbox = $('#popups_inbox'),
          zIndex = inbox.css('z-index'),
          t = wait_time || 6000;

      AMOCRM.notifications.show_message_error({
        text: message || '', header: header || ''
      });
      inbox.css('z-index', 9001);
      setTimeout(function() {
        inbox.css('z-index', zIndex);
      }, t);
    };

    self.getData = function() {
      $.ajax({
        url: '/api/v2/pipelines',
        async: false,
        success: function(data) {
          $.each(data._embedded.items, function(index, value) {
            var statuses_by_pipeline = [];
            pipeline = {option: value.name, id: value.id}
            pipelines.push(pipeline);

            for (var property1 in value.statuses) {
              if (value.statuses[property1].id === 142 || value.statuses[property1].id === 143) {
                continue;
              }
              var st = {option: value.statuses[property1].name, id: value.statuses[property1].id};
              statuses_by_pipeline.push(st);
            }

            statuses[index] = statuses_by_pipeline
          });
        }
      });

      weekDay = [
        {
          option: 'Пн',
          id: 'Mon'
        },
        {
          option: 'Вт',
          id: 'Tue'
        },
        {
          option: 'Ср',
          id: 'Wed'
        },
        {
          option: 'Чт',
          id: 'Thu'
        },
        {
          option: 'Пт',
          id: 'Fri'
        },
        {
          option: 'Сб',
          id: 'Sat'
        },
        {
          option: 'Вс',
          id: 'Sun'
        }
      ];

      var users = AMOCRM.constant('account').users;

      for (var prop in users) {
        var user = {option: users[prop], id: prop};
        responsible.push(user)
      }

      $.each(AMOCRM.todo_types, function(index, value) {
        var types = {option: value, id: index}
        task_types.push(types);
      });

      $.each(AMOCRM.constant('task_types'), function(index, value) {
        var types = {option: value.option, id: value.id}
        task_types.push(types);
      });
    };

    this.callbacks = {
      render: function() {
        w_code = self.get_settings().widget_code;
        if ($("#" + w_code + "_link").length < 1) {
          var icon_widget = '<div class="nav__menu__item" data-entity="linerapp_todo"><a id="' + w_code + '_link" class="nav__menu__item__link"><div class="nav__menu__item__icon icon-calendar2"></div><div class="nav__menu__item__title">Автозадачи</div></a></div>';
          $(icon_widget).insertAfter("[data-entity='todo']");
        }
        return true;
      },

      init: function() {
        w_code = self.get_settings().widget_code;
        widgetName = AMOCRM.widgets["list"][w_code]["langs"]["widget"]["name"];

        if (typeof AMOCRM.widgets.list[w_code] != "undefined") {
          activeWidget = AMOCRM.widgets.list[w_code].params.widget_active == "Y" ? true : false;
        }

        if (activeWidget){
          licenseStatus = objCore.testLicense(AMOCRM.constant('account').subdomain, w_code);
          objCore.licenseNotification(licenseStatus, widgetName);
        }
        return true;
      },

      bind_actions: function() {

        $(document).off('click', '#linerapp_active_button').on('click', '#linerapp_active_button', function() {
          var code = $('#widget_settings__fields_wrapper').find('input[name="linnerwidget_code"]').val();
          if ($("#linerapp_ruls").prop('checked')) {
            hashServer = false;
            $.post(server + "/licenseCheck.php", {
              user: AMOCRM.constant('account').subdomain,
              w_code: "autotask",
              pass: code
            }, function(data) {
              hashServer = data;
              if (code != hashServer) {
                self.notifications('Ошибка активации', 'Неверный пароль для установки виджета');
              } else {
                self.notifications('Успех!', 'Пароль успешно активирован');
              }
            });
          } else {
            self.notifications('Вам необходимо', 'дать согласие на обработку данных');
          }
          return false;
        });

        self.getData();

        $(document).on("click", "." + w_code + '_addTask', function(e) {
          e.preventDefault();
          modal.destroy();

          var head = '<a href="#" id="' + w_code + '_editTask" class="' + w_code + '_editTask">Редактировать задачи</a><h2 class="modal-body__caption head_2 clear">Добавить задачу</h2><form id="' + w_code + '_form">';

          var pipelines_wrap = self.render(
              {ref: '/tmpl/controls/select.twig'},
              {
                items: pipelines,
                class_name: w_code,
                id: w_code + '_pipelines',
                name: 'pipeline'
              });
          var pipelines_title = "<div style='margin: 10px 0;'>Список воронок</div>";


          var statuses_wrap = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: statuses[Object.keys(statuses)[0]],
                class_name: w_code + ' ' + w_code + '_statuses',
                id: w_code + '_statuses',
                name: 'statuses[]'
              });
          var statuses_title = "<div style='margin: 10px 0;'>Список этапов</div>";

          var responsible_wrap = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: responsible,
                class_name: w_code,
                id: w_code + '_responsible',
                name: 'responsible[]',
                title: 'Ответственные:   '
              });
          var responsible_title = "<div style='margin: 10px 0;'>Список ответственных</div>";

          var schedule = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: weekDay,
                class_name: w_code,
                id: w_code + '_schedule',
                name: 'schedule[]',
                title: 'Выбрать день недели:  '
              });
          var schedule_title = "<div style='margin: 10px 0;'>Постановка задачи по дням недели</div>";
          schedule_title = '<div class="linerapp-autotask-schedule" data-status="active">' + schedule_title + schedule + '</div>';
          var task_types_wrap = self.render(
              {ref: '/tmpl/controls/select.twig'},
              {
                items: task_types,
                class_name: w_code,
                id: w_code + '_task_types',
                name: 'task_type'
              });
          var task_types_title = "<div style='margin: 10px 0;'>Типы задач</div>";

          var text = self.render(
              {ref: '/tmpl/controls/textarea.twig'},
              {
                class_name: 'text-input text-input-textarea validate-error-wrapper textarea-autosize modal-body__inner__textarea',
                id: 'add_task__textarea',
                name: 'body',
                placeholder: 'Добавьте комментарий'
              });


          var date_title = "<div style='margin: 10px 0;'>Постановка задачи по произвольному периоду</div>";

          var date_days = self.render(
              {ref: '/tmpl/controls/input.twig'},
              {
                name: 'date_days',
                value: "",
                class_name: ''
              });

          var date_hours = self.render(
              {ref: '/tmpl/controls/input.twig'},
              {
                name: 'date_hours',
                value: "",
                class_name: ''
              });

          var date_min = self.render(
              {ref: '/tmpl/controls/input.twig'},
              {
                name: 'date_min',
                value: "",
                class_name: ''
              });


          var style_code = '<style> .linerapp-autotask-widget span {display: inline-block;width: 33%;} .linerapp-autotask-widget span input {width: 100%;} .linerapp-autotask-schedule.readonly:after {position: absolute; left: 0;top: 0;width: 100%;height: 100%;background-color: rgba(0,0,0,0.1);content: "";z-index: 999;} .linerapp-autotask-schedule {position: relative; }</style>';
          var data = head + pipelines_title + pipelines_wrap + statuses_title + statuses_wrap + responsible_title + responsible_wrap +
              schedule_title +
              date_title + style_code + '<div class="linerapp-autotask-widget">' + '<span><div style="margin: 10px 0;">Количество дней</div>' + date_days + '</span>' + '<span><div style="margin: 10px 0;">Количество часов</div>' + date_hours + '</span>' + '<span><div style="margin: 10px 0;">Количество минут</div>' + date_min + '</span>' + '</div>' +
              task_types_title + task_types_wrap + text + '<div class="modal-body__actions"><button id="' + w_code + '_saveButton" type="button" class="button-input js-modal-accept js-button-with-loader modal-body__actions__save" tabindex="1"><span class="button-input-inner"><span class="button-input-inner__text">Сохранить</span></span></button><button type="button" class="button-input button-cancel" tabindex="2"><span>Отменить</span></button></div></form>';

          modal = new Modal({
            class_name: 'modal-window',
            init: function($modal_body) {
              var $this = $(this);
              $modal_body
                  .trigger('modal:loaded')
                  .html(data)
                  .trigger('modal:centrify')
                  .append('<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>');
            },
            destroy: function() {
            }
          });


          self.statusInterval();
          self.focusInterval();


        });

        $(document).on("change", "#" + w_code + "_pipelines", function() {
          var statuses_wrap = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: statuses[$(this).val()],
                class_name: w_code + ' ' + w_code + '_statuses',
                id: w_code + '_statuses',
                name: 'statuses[]'
              });

          $("." + w_code + "_statuses").replaceWith(statuses_wrap);
        });


        $(document).on("click", "#" + w_code + "_saveButton", function(e) {

          if (!self.selectedInterval()) {
            alert("Ошибка! Вы не выбрали не один тип периода простановки задач!");
            return false;
          }

          var flagSave = false;
          var loader = $('<div class="default-overlay widget-settings__overlay default-overlay-visible" id="service_overlay" style="z-index: 1005;"><span class="spinner-icon expanded spinner-icon-abs-center" id="service_loader"></span></div>').appendTo("body");

          e.preventDefault();
          var data = $("#" + w_code + "_form").serializeArray();
          data.push({name: "subdomain", value: AMOCRM.constant('account').subdomain});
          var url = $(this).data('id') ? 'https://terminal.linerapp.com/leads/autotask/' + AMOCRM.constant('account').subdomain + '/update/' + $(this).data('id') : "https://terminal.linerapp.com//leads/autotask/set";
          if (!flagSave) {
            flagSave = true;
            $.ajax({
              url: url,
              method: "POST",
              data: data,
              dataType: 'json',
              success: function(data) {
                if (data.error) {
                  alert(data.error);
                }
                modal.destroy();
                $('#' + w_code + '_link').trigger("click");
                setTimeout(function() {
                  flagSave = false;
                  loader.remove();
                }, 2000);
              }
            });
          }
        });

        $('#' + w_code + '_link').click(function(e) {
          e.preventDefault();

          $.ajax({
            url: 'https://terminal.linerapp.com/leads/autotask/' + AMOCRM.constant('account').subdomain + '/show',
            success: function(data) {

              var head = '<a href="#" id="' + w_code + '_addTask" class="' + w_code + '_addTask">Добавить задачи</a><h2 class="modal-body__caption head_2 clear">Добавленные задачи</h2>';

              var added_tasks = '';

              if (data.total == 0) {
                added_tasks += '<p class="empty">Ничего не найдено</p>';
              }
              else {
                for (key in data.autotasks) {
                  added_tasks += '<div class="' + w_code + '"><a class="added_task" href="#" data-id="' + data.autotasks[key].id + '">' + data.autotasks[key].body + '</a>';
                  added_tasks += self.render(
                      {ref: '/tmpl/controls/delete_button.twig'},
                      {
                        class_name: w_code + '_deleteTask',
                        name: 'deleteTask',
                        id: data.autotasks[key].id
                      });

                  added_tasks += '</div>';
                }
              }

              var editTask_wrap = head + added_tasks;

              modal = new Modal({
                class_name: 'modal-window',
                init: function($modal_body) {
                  var $this = $(this);
                  $modal_body
                      .trigger('modal:loaded')
                      .html(editTask_wrap)
                      .trigger('modal:centrify')
                      .append('<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>');
                },
                destroy: function() {
                }
              });

              if (data.total >= 10) {
                $('#' + w_code + '_addTask').hide();
              }
            }
          });
        });

        $(document).on("click", "#" + w_code + "_editTask", function(e) {
          e.preventDefault();
          modal.destroy();
          $('#' + w_code + '_link').trigger('click');
        });

        $(document).on("click", ".added_task", function(e) {
          e.preventDefault();

          $.ajax({
            url: 'https://terminal.linerapp.com/leads/autotask/' + AMOCRM.constant('account').subdomain + '/get/' + $(this).data('id'),
            method: "GET",
            context: this,
            success: function(data) {
              modal.destroy();

              self.getTemplate(
                  'editAutoTask',
                  {},
                  function(template) {
                    modal = new Modal({
                      class_name: 'modal-window',
                      init: function($modal_body) {
                        var $this = $(this);
                        $modal_body
                            .trigger('modal:loaded')
                            .html(
                                template.render({
                                  task: data.response,
                                  pipelines: pipelines,
                                  statuses: statuses[data.response.pipeline],
                                  responsible: responsible,
                                  schedule: weekDay,
                                  task_types: task_types,
                                  w_code: w_code
                                })
                            )
                            .trigger('modal:centrify')
                            .append('<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>');
                        self.statusInterval();
                        self.focusInterval();


                      },
                      destroy: function() {
                      }
                    });
                  }
              );
            }
          });
        });

        $(document).on("click", "." + w_code + '_deleteTask', function(e) {
          e.preventDefault();
          $.ajax({
            url: 'https://terminal.linerapp.com/leads/autotask/' + AMOCRM.constant('account').subdomain + '/delete/' + $(this).attr('id'),
            method: "POST",
            context: this,
            success: function(data) {
              $('#' + w_code + '_addTask').show();
              $(this).parent().remove();
            }
          });
        });

        $(document).off('click', '#linerapp_request_button').on('click', '#linerapp_request_button', function() {
          var widget = self.i18n('widget');
          var settings = AMOCRM.widgets.system;

          self.crm_post(
              self.getServerUrl(),
              {
                action: "add-lead",
                name: widget.name,
                amohash: settings.amohash,
                amouser: settings.amouser,
                domain: settings.domain,
              },
              function(response) {
                if (response.status == 'ok') {
                  self.notifications('Запрос успешно отправлен', 'Запрос на тестовый период принят.');
                }
                if (response.status == 'error') {
                  self.notifications('Ошибка', 'Произошла ошибка, попробуйте еще раз.');
                }
              },
              'json'
          );
        });

        return true;
      },
      settings: function() {
        hashServer = $("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val();
        var twig = require('twigjs');
        if (!( $('#linerapp-copy').attr('id') || false )) {
          $('head').append('<link type="text/css" rel="stylesheet"  id="linerapp-copy" href="/widgets/' + w_code + '/css/autotask.css" />');
        }
        $(".modal-body .widget_settings_block").addClass(w_code);


        // Воставляем элементы

        $(".widget_settings_block__item_field").eq(0).hide();



        $(".widget-autotask__desc-expander_hidden").css("height", "auto");
        var sValCode = self.params.linnerwidget_code;
        if (typeof sValCode == "undefined" || !sValCode) {
          var linerapp_request_button = twig({ref: '/tmpl/controls/button.twig'}).render({
            name: 'linerapp_request_button',
            id: 'linerapp_request_button',
            text: "Запрос тестового периода",
            class_name: 'button-input_blue'
          });
        //  $('#widget_settings__fields_wrapper').prepend('<div class = "widget_settings_block__item_field">' + linerapp_request_button + '</div>');
        }

        var dop_field = '<div class="widget_settings_block__item_field">' +
            '<label class="control-checkbox checkboxes_dropdown__label   is-checked">' +
            '<div class="control-checkbox__body">' +
            '<input type="checkbox" class="js-item-checkbox" name="" id="linerapp_ruls" value="" checked data-value="1">' +
            '<span class="control-checkbox__helper "></span>' +
            '</div>' +
            '<div class="control-checkbox__text element__text checkboxes_dropdown__label_title yp_confirm_ruls" style="white-space: normal; font-size: 12px;">Я подтверждаю согласие на передачу данных аккаунта amoCRM на удаленный сервер для обеспечения работоспособности виджета.</div>' +
            '</label>' +
            '</div>';
        $('#widget_settings__fields_wrapper').append(dop_field);

        $("button.js-widget-save, .js-widget-install").click(function() {
          if ($("#linerapp_ruls").prop("checked") !== true) {
            self.notifications('Вам необходимо', 'дать согласие на обработку данных');
            return false;
          }
          if ($("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val() != hashServer) {
            self.notifications("Ошибка установки", "Неверный пароль для установки виджета");
            return false;
          }
          return true;
        });

        return true;
      },
      onSave: function() {
        $.ajax({
          url: 'https://terminal.linerapp.com/account/add',
          method: "POST",
          data: {
            subdomain: AMOCRM.constant('account').subdomain,
            login: AMOCRM.constant('user').login,
            hash: AMOCRM.constant('user').api_key
          },
          dataType: 'json',
          success: function(data) {
          }
        });

        return true;
      },
      destroy: function() {
        $.get(server + "/destroy/autotask/" + AMOCRM.constant('account').subdomain);
      },
      contacts: {
        selected: function() {
        }
      },
      leads: {
        selected: function() {
        }
      },
      tasks: {
        selected: function() {
        }
      }
    };
    return this;
  };
  return CustomWidget;


});