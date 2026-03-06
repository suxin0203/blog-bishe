<template>
  <div class="questionform">
    <form>
      <div
        v-for="(field, index) in fields"
        :key="index"
        class="oneinput animate__animated animate__headShake"
        :class="{ animate__lightSpeedOutRight: field.outcss }"
      >
        <template v-if="field.type === 'text'">
          <n-form-item path="password" :label="field.label + '：'">
            <n-input
              class="inputw"
              v-model:value="field.value"
              type="text"
              placeholder="基本的 Input"
            />
          </n-form-item>
        </template>
        <template v-else-if="field.type === 'select'">
          <n-form-item path="password" :label="field.label">
            <n-select
              v-model:value="field.value"
              :options="field.options"
              class="inputw"
            />
          </n-form-item>
        </template>
        <template v-else-if="field.type === 'radio'">
          <n-form-item path="password" :label="field.label">
            <div
              v-for="(option, optionIndex) in field.options"
              :key="optionIndex"
            >
              <n-radio
                :checked="checkedValueRef === option.value"
                :value="option.value"
                name="basic-demo"
                @change="handleChange"
              >
                {{ option.label }}
              </n-radio>
            </div>
          </n-form-item>
        </template>
        <n-button
          tertiary
          type="error"
          round
          @click="deleteField(index)"
          style="margin-left: 10px"
        >
          删除
        </n-button>
      </div>
      <n-button type="success" @click.prevent="submitForm"> 提交 </n-button>
    </form>
    <div class="oneinput">
      <label>新 增 ：</label>
      <n-select
        v-model:value="newFieldType"
        :options="addoptions"
        class="inputw"
      />
      <n-button strong secondary round type="primary" @click="addField()">
        添加
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, ref, inject, onMounted, reactive } from "vue";
let fields = reactive([
  { type: "text", value: "", label: "姓名" },
]);
let newFieldType = ref("text");
const checkedValueRef = ref(null);
const addoptions = [
  { label: "输入框", value: "text" },
  { label: "选择框", value: "select" },
  { label: "单选", value: "radio" },
];

const handleChange = (e) => {
  checkedValueRef.value = e.target.value;
};
const addField = () => {
  if (newFieldType.value === "text") {
    fields.push({ type: "text", value: "", outcss: false, label: "输入框" });
  } else if (newFieldType.value === "select") {
    fields.push({
      type: "select",
      value: "1",
      outcss: false,
      label: "下拉框",
      options: [
        { label: "下拉选项1", value: "1" },
        { label: "下拉选项2", value: "2" },
        { label: "下拉选项3", value: "3" },
      ],
    });
  } else if (newFieldType.value === "radio") {
    fields.push({
      type: "radio",
      value: "1",
      outcss: false,
      label: "单选",
      options: [
        { label: "单选 1", value: "1" },
        { label: "单选 2", value: "2" },
        { label: "单选 3", value: "3" },
      ],
    });
  }
};
const deleteField = (index) => {
  // fields[index].outcss = true;
  // setTimeout(() => {
  fields.splice(index, 1);
  // }, 1000);
};
const submitForm = () => {
  // 在这里提交表单数据到后端服务器进行处理
};
</script>
<style scoped lang="less">
.questionform {
  width: 95%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
}
.inputw {
  width: 300px;
}
.oneinput {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
