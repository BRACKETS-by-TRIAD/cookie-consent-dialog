import { htmlToElement } from './utils';
import EventDispatcher from './event-dispatcher';
import DialogTablist from './dialog-tablist';

/**
 * Dialog which is shown to update cookie preferences.
 */
const Dialog = ({ config, preferences }) => {

  const tabList = DialogTablist({ config, preferences });
  const events = EventDispatcher();

  const TEMPLATE = config.get('template');
  const POSITION = config.get('position');
  const TYPE = config.get('type');
  const PREFIX = config.get('prefix');

  // Only allow the `acceptAllButton` when no preferences have been stored.
  const ACCEPT_ALL_BUTTON = config.get('acceptAllButton') && !preferences.hasPreferences();

  /**
   * Render dialog element.
   */
  const renderDialog = () => {
    let classes = '';
    if (TEMPLATE === 'banner') {
      classes = `${PREFIX}--banner ${PREFIX}--${POSITION === 'top' ? 'top' : 'bottom'}`;
    } else if (TEMPLATE === 'overlay') {
      classes = `${PREFIX}--overlay`;
    } else if (TEMPLATE === 'popup') {
      classes = `${PREFIX}--popup ${PREFIX}--${POSITION === 'left' ? 'left' : 'right'}`;
    }

    let policyLink = config.get('labels.policyLink.href') ? `<a href="${config.get('labels.policyLink.href')}" target="_blank">${config.get('labels.policyLink.text')}</a>` : '';
    let settingsLink = config.get('collapsible') ? `<a id="${PREFIX}-settings" href="javascript:void(0);">${config.get('labels.settingsLink.text')}</a>` : '';

    return `
      <aside id="${PREFIX}" class="${PREFIX} ${classes} js-cookie-bar" role="dialog" aria-live="polite" aria-describedby="${PREFIX}-description" aria-hidden="true" tabindex="0">
        <!--googleoff: all-->
        <div class="${PREFIX}__inner">
          <form>
            <header class="${PREFIX}__header" id="${PREFIX}-description">
              <h1>${config.get('labels.title')}</h1>
              ${config.get('labels.description')}
              <div class="${PREFIX}__links">
                  ${policyLink}
                  ${settingsLink}
              </div>
            </header>
              
            <button class="${PREFIX}__button" aria-label="${config.get('labels.aria.button')}">
              <span>${config.get('labels.button.default')}</span>
            </button>
          </form>
        </div>
        <!--googleon: all-->
      </aside>
    `;
  };

  /**
   * Dialog and form elements.
   */
  const dialog = htmlToElement(renderDialog());
  const form = dialog.querySelector('form');
  const button = form.querySelector('button');
  const settingsLink = dialog.querySelector(`#${PREFIX}-settings`);

  /**
   * Hide/show helpers.
   */
  const hide = () => dialog.setAttribute('aria-hidden', 'true');
  const show = () => dialog.setAttribute('aria-hidden', 'false');

  /**
   * Compose values based on input type, the `acceptAllButton` configuration,
   * any stored preferences and the state of the input options.
   *
   * When an option is checked, the form will just submit. When nothing is checked,
   * it depends on the type and the `acceptAllButton` config setting.
   *
   * - Radio + option checked: success
   * - Radio + nothing checked + has `acceptAllButton`: select first + success
   * - Radio + nothing checked + no `acceptAllButton`: fail
   *
   * - Checkbox + option(s) checked: success
   * - Checkbox + nothing checked + has `acceptAllButton`: select all + success
   * - Checkbox + nothing checked + no `acceptAllButton`: success
   */
  const composeValues = values => {

    // Radio when no option is selected.
    if (TYPE === 'radio' && !values.find(v => v.accepted)) {
      // If the `acceptAllButton` option is configured, select the first option and
      // let the form submit as if the user had selected it.
      if (ACCEPT_ALL_BUTTON) {
        values[0].accepted = true;
        return values;
      }
      // Do not submit if no option is selected and `acceptAllButton` is not configured.
      return [];
    }

    // Checkbox with `acceptAllButton` and no user-choosable option is checked.
    // We compare amount of required options against checked options.
    const requiredCount = config.get('cookies').filter(c => c.required).length;
    const checkedCount = values.filter(v => v.accepted).length;
    const userOptionsChecked = checkedCount > requiredCount;
    if (ACCEPT_ALL_BUTTON && TYPE === 'checkbox' && !userOptionsChecked) {
      return values.map(value => ({
        ...value,
        accepted: true,
      }));
    }

    // Return the values untouched. Happens for:
    // - Radio when an option has been selected.
    // - Checkbox with or without checked option, except the `acceptAllButton` case above.
    return values;

  };

  /**
   * Handle form submits.
   */
  const submitHandler = e => {
    e.preventDefault();

    // Get values based on the rules defined in `composeValues`.
    const values = composeValues(tabList.getValues());
    if (!values) {
      return;
    }

    // Dispatch values and hide the dialog.
    events.dispatch('submit', values);
    hide();
  };

  /**
   * Update button label.
   */
  const updateButtonLabel = label => {
    button.textContent = label;
  };

  return {
    init() {
      // Initialize tab list and append it to the form.
      tabList.init();
      form.insertBefore(tabList.element, form.lastElementChild);

      // Attach submit listener to the form.
      form.addEventListener('submit', submitHandler);

      // Update initial button label if `acceptAllButton` is set to true,
      // and no cookie preferences have been stored. Also listen for changes
      // in the form, and revert the button back to normal when an option has
      // been selected.
      if (ACCEPT_ALL_BUTTON) {
        updateButtonLabel(config.get('labels.button.acceptAll'));
        form.addEventListener('change', e => {
          updateButtonLabel(config.get('labels.button.default'));
        });
      }

      if (settingsLink) {
        tabList.element.classList.add('hidden');

        settingsLink.addEventListener('click', function(event) {
          event.preventDefault();
          tabList.element.classList.toggle('hidden');
          tabList.element.classList.toggle('visible');
        });
      }
    },
    on: events.add,
    show,
    hide,
    element: dialog,
  };

};

export default Dialog;
