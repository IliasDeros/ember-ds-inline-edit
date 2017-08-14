import Ember from 'ember'
import { moduleForComponent, test } from 'ember-qunit'
import hbs from 'htmlbars-inline-precompile'
import { startMirage } from 'dummy/initializers/ember-cli-mirage'

moduleForComponent('ds-inline-edit', 'DsInlineEdit', {
  integration: true,

  beforeEach(){
    this.inject.service('store')
    this.server = startMirage()

    this.CODE_ENTER = 13
  },

  afterEach(){
    this.server.shutdown()
  }
})

test('updating a property does not update the rest of the model', function(assert) {
  const done = assert.async()
  const { id } = this.server.create('dummy')

  Ember.run(() => this.store.findRecord('dummy', id).then(model => renderComponent.call(this, model)))

  function renderComponent(model){
    this.set('model', model)

    this.render(hbs`
      {{ds-inline-edit
        model=model
        prop="description"
        id="component"
      }}
    `)

    // click input to toggle edit mode
    Ember.run(() => this.$('#component').click())

    // enter new value and trigger ember "value" observers
    Ember.run(() => this.$('#component input')
      .val('new description')
      .trigger('change')
    )

    // update another unrelated value
    model.set('name', 'new name')

    // press enter to submit
    const enter = Ember.$.Event('keydown')
    enter.which = this.CODE_ENTER
    Ember.run(() => this.$('#component').trigger(enter))

    // let model.save() update "model"
    Ember.run.next(verifyPersistence.bind(this))

    function verifyPersistence(){
      assert.notEqual(model.get('name'), 'new name', 'other field is not updated')
      assert.equal(model.get('description'), 'new description', 'description is updated')

      // let model be updated upon model.save() resolution
      Ember.run.next(() => {
        assert.equal(model.get('name'), 'new name', 'other is set back to its modified value once model is persisted')
        done()
      })
    }
  }
})

test('"displayValue" displayed correctly for object model', function(assert){
  const done = assert.async()
  const { id } = this.server.create('dummy')
  Ember.run(() => this.store.findRecord('dummy', id).then(dummy => renderComponent.call(this, dummy)))

  function renderComponent(dummy){
    const model = Ember.Object.create({ dummy })
    this.set('model', model)

    // 1. displayName
    dummy.set('displayName', 'expected display name')
    renderTemplate.call(this)
    assert.ok(this.$('#component > span').text().includes('expected display name'), 'idle value is "displayName" first')

    // 2. name
    dummy.set('displayName', null)
    renderTemplate.call(this)
    assert.ok(this.$('#component > span').text().includes(dummy.get('name')), 'idle value is "name" if no displayName')

    // 3. id
    dummy.set('name', null)
    renderTemplate.call(this)
    assert.ok(this.$('#component > span').text().includes(dummy.get('id')), 'idle value is id if no displayName or name')

    done()
  }

  function renderTemplate(){
    this.render(hbs`
      {{ds-inline-edit
        model=model
        prop="dummy"
        id="component"
      }}
    `)
  }
})

test('call "customUpdate" when defined', function(assert){
  const done = assert.async()
  const { id } = this.server.create('dummy')

  Ember.run(() => this.store.findRecord('dummy', id).then(model => renderComponent.call(this, model)))

  function renderComponent(model){
    let customUpdateArgs = []

    this.setProperties({
      model,
      customUpdate: function(){ customUpdateArgs = arguments }
    })

    this.render(hbs`
      {{ds-inline-edit
        model=model
        prop="description"
        id="component"
        customUpdate=(action customUpdate)
      }}
    `)

    // click input to toggle edit mode
    Ember.run(() => this.$('#component').click())

    // enter new value and trigger ember "value" observers
    Ember.run(() => this.$('#component input')
      .val('new description')
      .trigger('change')
    )

    // press enter to submit
    const enter = Ember.$.Event('keydown')
    enter.which = this.CODE_ENTER
    Ember.run(() => this.$('#component').trigger(enter))

    // let model.save() potentially update "model"
    Ember.run.next(verifyCustomFunctionCall.bind(this))

    function verifyCustomFunctionCall(){
      assert.notEqual(model.get('description'), 'new description', 'description is not updated')

      let [value, modelArg, propertyArg] = customUpdateArgs
      assert.equal(value, 'new description', 'value is passed as first argument to "customUpdate"')
      assert.equal(modelArg, model, 'model is passed as second argument to "customUpdate"')
      assert.equal(propertyArg, 'description', 'property is passed as third argument to "customUpdate"')
      done()
    }
  }
})

test('call "onUpdate" with model on successful update', function(assert){
  let calledWith
  const spyFn = param => calledWith = { model: param }

  const done = assert.async()
  const { id } = this.server.create('dummy')

  Ember.run(() => this.store.findRecord('dummy', id).then(model => renderComponent.call(this, model)))

  function renderComponent(model){
    this.setProperties({
      model,
      onUpdate: spyFn
    })

    this.render(hbs`
      {{ds-inline-edit
        model=model
        prop="description"
        id="component"
        onUpdate=onUpdate
      }}
    `)

    // click input to toggle edit mode
    Ember.run(() => this.$('#component').click())

    // enter new value and trigger ember "value" observers
    Ember.run(() => this.$('#component input')
      .val('new description')
      .trigger('change')
    )

    // update another unrelated value
    model.set('name', 'new name')

    // press enter to submit
    const enter = Ember.$.Event('keydown')
    enter.which = this.CODE_ENTER
    Ember.run(() => this.$('#component').trigger(enter))

    // let model.save() update "model"
    Ember.run.next(verifyError.bind(this))

    function verifyError(){
      // let model.save().then call "onUpdate"
      Ember.run.next(() => {
        assert.deepEqual(calledWith && calledWith.model, model, '"onUpdate" called with model')
        done()
      })
    }
  }
})

test('call "onError" with update error when a server error occurs', function(assert){
  let calledWith
  const expectedErrorMessage = 'Expected error message'
  const spyFn = params => calledWith = { errors: params }

  this.server.patch('/dummies/:id', { errors: [expectedErrorMessage] }, 500)

  const done = assert.async()
  const { id } = this.server.create('dummy')

  Ember.run(() => this.store.findRecord('dummy', id).then(model => renderComponent.call(this, model)))

  function renderComponent(model){
    this.setProperties({
      model,
      onError: spyFn
    })

    this.render(hbs`
      {{ds-inline-edit
        model=model
        prop="description"
        id="component"
        onError=onError
      }}
    `)

    // click input to toggle edit mode
    Ember.run(() => this.$('#component').click())

    // enter new value and trigger ember "value" observers
    Ember.run(() => this.$('#component input')
      .val('new description')
      .trigger('change')
    )

    // update another unrelated value
    model.set('name', 'new name')

    // press enter to submit
    const enter = Ember.$.Event('keydown')
    enter.which = this.CODE_ENTER
    Ember.run(() => this.$('#component').trigger(enter))

    // let model.save() update "model"
    Ember.run.next(verifyError.bind(this))

    function verifyError(){
      // let model.save().catch throw error
      Ember.run.next(() => {
        assert.notEqual(model.get('description'), 'new description', 'description field is reverted')
        assert.equal(model.get('name'), 'new name', 'name field is not reverted since it wasnt the field being edited')
        assert.deepEqual(calledWith && calledWith.errors.errors, [expectedErrorMessage], '"onError" called with server error')
        done()
      })
    }
  }
})