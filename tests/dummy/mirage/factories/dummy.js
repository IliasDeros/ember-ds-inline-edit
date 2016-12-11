import { Factory, faker } from 'ember-cli-mirage'

export default Factory.extend({
  name(){ return faker.name.findName() },
  description(){ return faker.lorem.sentence() }
})
