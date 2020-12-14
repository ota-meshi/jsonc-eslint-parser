<template>
  <div class="ast-options">
    <label>
      jsonSyntax
      <select
        :value="modelValue.jsonSyntax"
        @change="updateJsonSyntax($event.target.value)"
      >
        <option value="">Unset</option>
        <option value="JSON">JSON</option>
        <option value="JSONC">JSONC</option>
        <option value="JSON5">JSON5</option>
      </select>
    </label>
    <label>
      ecmaVersion
      <select
        :value="modelValue.ecmaVersion"
        @change="updateEcmaVersion($event.target.value)"
      >
        <option value="">Unset</option>
        <option value="5">5</option>
        <option value="2015">2015</option>
        <option value="2016">2016</option>
        <option value="2017">2017</option>
        <option value="2018">2018</option>
        <option value="2019">2019</option>
        <option value="2020">2020</option>
        <option value="2021">2021</option>
      </select>
    </label>
    <label
      ><input
        type="checkbox"
        :checked="modelValue.showLocations"
        @change="updateShowLocations($event.target.checked)"
      />
      Locations
    </label>
  </div>
</template>

<script>
export default {
  name: "AstOptions",
  props: {
    modelValue: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  emits: ["update:modelValue"],
  methods: {
    updateJsonSyntax(newValue) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        jsonSyntax: newValue,
      });
    },
    updateEcmaVersion(newValue) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        ecmaVersion: newValue,
      });
    },
    updateShowLocations(newValue) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        showLocations: newValue,
      });
    },
  },
};
</script>

<style scoped>
.ast-options {
  text-align: right;
}
label {
  padding-left: 8px;
}
</style>
