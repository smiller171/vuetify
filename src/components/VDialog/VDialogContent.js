import '../../stylus/components/_dialogs.styl'

// Mixins
import Dependent from '../../mixins/dependent'
import Detachable from '../../mixins/detachable'
import Overlayable from '../../mixins/overlayable'
import Returnable from '../../mixins/returnable'
import Stackable from '../../mixins/stackable'
import Toggleable from '../../mixins/toggleable'

// Directives
import ClickOutside from '../../directives/click-outside'

// Helpers
import { getZIndex } from '../../util/helpers'

export default {
  name: 'v-dialog-content',

  mixins: [
    Dependent,
    Detachable,
    Overlayable,
    Returnable,
    Stackable,
    Toggleable
  ],

  directives: {
    ClickOutside
  },

  data () {
    return {
      isDependent: false,
      stackClass: 'dialog__content__active',
      stackMinZIndex: 200
    }
  },

  props: {
    disabled: Boolean,
    persistent: Boolean,
    fullscreen: Boolean,
    fullWidth: Boolean,
    maxWidth: {
      type: [String, Number],
      default: 'none'
    },
    origin: {
      type: String,
      default: 'center center'
    },
    width: {
      type: [String, Number],
      default: 'auto'
    },
    scrollable: Boolean,
    transition: {
      type: [String, Boolean],
      default: 'dialog-transition'
    }
  },

  computed: {
    classes () {
      return {
        [(`dialog ${this.contentClass}`).trim()]: true,
        'dialog--active': this.isActive,
        'dialog--persistent': this.persistent,
        'dialog--fullscreen': this.fullscreen,
        'dialog--scrollable': this.scrollable
      }
    },
    contentClasses () {
      return {
        'dialog__content': true,
        'dialog__content__active': this.isActive
      }
    },
    computedStyle () {
      return this.fullscreen || {
        maxWidth: this.maxWidth === 'none' ? undefined : (isNaN(this.maxWidth) ? this.maxWidth : `${this.maxWidth}px`),
        width: this.width === 'auto' ? undefined : (isNaN(this.width) ? this.width : `${this.width}px`)
      }
    }
  },

  watch: {
    isActive (val) {
      if (val) {
        this.show()
      } else {
        this.removeOverlay()
        this.unbind()
      }
    }
  },

  mounted () {
    this.isBooted = this.isActive
    this.isActive && this.show()
  },

  beforeDestroy () {
    if (typeof window !== 'undefined') this.unbind()
  },

  methods: {
    closeConditional (e) {
      // close dialog if !persistent, clicked outside and we're the topmost dialog.
      // Since this should only be called in a capture event (bottom up), we shouldn't need to stop propagation
      return this.isActive && !this.persistent &&
        getZIndex(this.$refs.content) >= this.getMaxZIndex() &&
        !this.$refs.content.contains(e.target)
    },
    show () {
      !this.fullscreen && !this.hideOverlay && this.genOverlay()
      this.fullscreen && this.hideScroll()
      this.$refs.content.focus()
      this.$listeners.keydown && this.bind()
    },
    bind () {
      window.addEventListener('keydown', this.onKeydown)
    },
    unbind () {
      window.removeEventListener('keydown', this.onKeydown)
    },
    onKeydown (e) {
      this.$emit('keydown', e)
    }
  },

  render (h) {
    return h('div', {
      class: this.contentClasses,
      attrs: { tabIndex: -1 },
      style: { zIndex: this.activeZIndex },
      ref: 'content'
    }, [
      h('transition', {
        props: {
          name: this.transition || '', // If false, show nothing
          origin: this.origin
        }
      }, [
        h('div', {
          class: this.classes,
          style: this.computedStyle,
          ref: 'dialog',
          directives: [
            {
              name: 'click-outside',
              value: () => (this.isActive = false),
              args: {
                closeConditional: this.closeConditional,
                include: this.getOpenDependentElements
              }
            },
            { name: 'show', value: this.isActive }
          ],
          on: {
            click: e => { e.stopPropagation() }
          }
        }, this.showLazyContent(this.$slots.default))
      ])
    ])
  }
}
