define(['jquery', 'lib/components/base/modal'], function($, Modal) {
  var CustomWidget = function() {

    var self = this;
    var pipelines = [];
    var responsible = [];
    var task_types = [];
    var statuses = {};
    var server = "https://terminal.linerapp.com";
    var hashServer;
    $.post(server + "/licenseCheck.php", {
      user: AMOCRM.constant('account').subdomain,
      w_code: "autotask"
    }, function(data) {
      hashServer = data;
    });

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
        return true;
      },

      bind_actions: function() {
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

          var statuses_wrap = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: statuses[Object.keys(statuses)[0]],
                class_name: w_code + ' ' + w_code + '_statuses',
                id: w_code + '_statuses',
                name: 'statuses[]'
              });

          var responsible_wrap = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: responsible,
                class_name: w_code,
                id: w_code + '_responsible',
                name: 'responsible[]',
                title: 'Ответственные:   '
              });

          var schedule = self.render(
              {ref: '/tmpl/controls/checkboxes_dropdown.twig'},
              {
                items: weekDay,
                class_name: w_code,
                id: w_code + '_schedule',
                name: 'schedule[]',
                title: 'Выбрать день недели:  '
              });

          var task_types_wrap = self.render(
              {ref: '/tmpl/controls/select.twig'},
              {
                items: task_types,
                class_name: w_code,
                id: w_code + '_task_types',
                name: 'task_type'
              });

          var text = self.render(
              {ref: '/tmpl/controls/textarea.twig'},
              {
                class_name: 'text-input text-input-textarea validate-error-wrapper textarea-autosize modal-body__inner__textarea',
                id: 'add_task__textarea',
                name: 'body',
                placeholder: 'Добавьте комментарий'
              });

          var data = head + pipelines_wrap + statuses_wrap + responsible_wrap + schedule + task_types_wrap + text + '<div class="modal-body__actions"><button id="' + w_code + '_saveButton" type="button" class="button-input js-modal-accept js-button-with-loader modal-body__actions__save" tabindex="1"><span class="button-input-inner"><span class="button-input-inner__text">Сохранить</span></span></button><button type="button" class="button-input button-cancel" tabindex="2"><span>Отменить</span></button></div></form>';

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
          e.preventDefault();
          var data = $("#" + w_code + "_form").serializeArray();
          data.push({name: "subdomain", value: AMOCRM.constant('account').subdomain});
          var url = $(this).data('id') ? 'https://terminal.linerapp.com/leads/autotask/' + AMOCRM.constant('account').subdomain + '/update/' + $(this).data('id') : "https://terminal.linerapp.com//leads/autotask/set";
          $.ajax({
            url: url,
            method: "POST",
            data: data,
            dataType: 'json',
            success: function(data) {

              if (data.error) {
                alert(data);
              }

              modal.destroy();

              $('#' + w_code + '_link').trigger("click");
            }
          });
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
        $(".widget-settings-block__desc-expander_hidden").css("height", "auto");
        var sValCode = self.params.linnerwidget_code;
        if (typeof sValCode == "undefined" || !sValCode) {
          var twig = require('twigjs');
          var linerapp_request_button = twig({ref: '/tmpl/controls/button.twig'}).render({
            name: 'linerapp_request_button',
            id: 'linerapp_request_button',
            text: "Запрос тестового периода",
            class_name: 'button-input_blue'
          });
          $('#widget_settings__fields_wrapper').prepend('<div class = "widget_settings_block__item_field">' + linerapp_request_button + '</div>');
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