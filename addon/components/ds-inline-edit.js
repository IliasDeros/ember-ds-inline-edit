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
    this._super(...arguments)

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
    this._super(...arguments)
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

  onEditSuccess(){
    this._super(...arguments)
    this.onUpdate && this.onUpdate(...arguments)
  },

  onEditError(error, previousValue){
    this._super(...arguments)
    const prop = this.get('prop')

    this.set(`model.${prop}`, previousValue)
    this.onError ? this.onError(...arguments) : console.error(error)
  },

  actions: {
    confirmEdit(){
      const { model, prop, value } = this.getProperties('model', 'prop', 'value')
      const previousValue = model.get(prop)

      this.set('isEditing', false)
      model.set(prop, value)

      // only update the currently edited value
      const modifiedAttrs = {}
      const otherAttrs = model.changedAttributes()
      delete otherAttrs[prop]
      Object.keys(otherAttrs).forEach(a => {
        let [persistedAttr, modifiedAttr] = otherAttrs[a]
        model.set(a, persistedAttr)
        modifiedAttrs[a] = modifiedAttr
      })

      return model.save()
        .then(updatedModel => this.onEditSuccess(updatedModel))
        .catch(error => this.onEditError(error, previousValue))
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
