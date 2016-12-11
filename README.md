# DS-inline-edit

Edit an ember DS.model inline by clicking on it to toggle editor.
Click outside or press escape to rollback change and cancel edit.

inspired by [ember-inline-edit](https://github.com/swastik/ember-inline-edit)

![Inline Edit Demo](https://github.com/IliasDeros/ds-inline-edit/raw/master/demo.gif)

## Installation

`ember install ds-inline-edit`

## Usage

Use the `ds-inline-edit` component and provide it a model with the property to edit/display.

```handlebars
  {{ds-inline-edit
    model=model
    prop='name'
  }}
```

#### Ember Data Integration

This plugin relies on a strict usage of Ember Data. An automatic model update
is sent upon confirming edit.

If the `prop` is an object, the default display is the following property of the model :
`displayName` > `name` > `id`

Only the property identified through `prop` is updated, the rest of the model remains
uncommited.

#### Keyboard Support

Currently, the only way to confirm an edit is to hit `enter`.

Hitting `esc` or clicking outside the component will also discard the edit.