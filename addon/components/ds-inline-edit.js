import Ember from 'ember'
import layout from '../templates/components/ds-inline-edit'

export default Ember.Component.extend({
  layout,

  dsInlineEditTemplate: 'components/ds-inline-edit/ds-inline-edit',

  isEditing: false,

  value: Ember.computed('model', 'prop', function(){
    return Ember.get(this.get('model'), this.get('prop'))
  }),

  displayValue: Ember.computed('value', function(){
    const value = this.get('value')

    if (Ember.typeOf(value) === 'instance'){
      return value.get('displayName') || value.get('name') || value.get('id')
    } else {
      return value
    }
  }),

  didInsertElement(){
    // handle click inside and outside component
    Ember.$(document).on(`click.${Ember.guidFor(this)}`, e => {
      if (this.get('disabled')) { return }

      const element = Ember.$(this.element)
      const target = Ember.$(e.target)
      const isInside = element.is(target) || element.has(target).length

      if (isInside){
        if (!this.get('isEditing')){
          this.set('isEditing', true)
          Ember.run.next(() => this.$('input').focus())
        }
      } else {
        this.get('isEditing') && this.send('cancelEdit')
      }
    })
  },

  willDestroyElement(){
    Ember.$(document).off(`click.${Ember.guidFor(this)}`)
  },

  keyDown(e){
    const enterKeyCode = 13
    const escKeyCode = 27

    switch (e.which){
      case enterKeyCode:
        this.send('confirmEdit')
        break
      case escKeyCode:
        this.send('cancelEdit')
        break
    }
  },

  actions: {
    confirmEdit(){
      const model = this.get('model')
      const prop = this.get('prop')
      const previousValue = model.get(prop)

      this.set('isEditing', false)
      model.set(prop, this.get('value'))

      // only update the currently edited value
      const modifiedAttrs = {}
      const otherAttrs = model.changedAttributes()
      delete otherAttrs[prop]
      Object.keys(otherAttrs).forEach(a => {
        let [persistedAttr, modifiedAttr] = otherAttrs[a]
        model.set(a, persistedAttr)
        modifiedAttrs[a] = modifiedAttr
      })

      model.save()
        .catch(error => {
          model.set(prop, previousValue)
          console.error(error)
        })
        .finally(() => {
          Object.keys(modifiedAttrs).forEach(a => {
            model.set(a, modifiedAttrs[a])
          })
        })
    },

    cancelEdit(){
      this.set('isEditing', false)

      const oldValue = Ember.get(this.get('model'), this.get('prop'))
      this.set('value', oldValue)
    }
  }
})
