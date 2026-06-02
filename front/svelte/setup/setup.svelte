<div class="bg-white p-5 rounded col-11 col-lg-4">
  <h1 class="text-center"><BilingualText key="initial_setup" /></h1>
  <p class="text-center"><BilingualText key="setup_description" /></p>
  {#if serverError !== ""}
  <p class="text-danger">{get(bi)('error_occurred_prefix')}{serverError}</p>
  {/if}
  <div class="border rounded p-3">
    <form novalidate>
      <div class="mb-3">
        <label for="year" class="form-label"><BilingualText key="fiscal_year" />&nbsp;<span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <div class="input-group">
          <input type="number" class="form-control {invalid.year ? "is-invalid" : "is-valid"} " id="year" min="1900" bind:value={form.year} >
          <span class="input-group-text"><BilingualText key="fiscal_year" /></span>
        </div>
        {#if invalid.year }
          <div class="text-danger">
            {message.year}
          </div>
        {/if}
      </div>
      <div class="mb-3">
        <label for="term" class="form-label"><BilingualText key="term" />&nbsp;<span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <div class="input-group">
          <input type="number" class="form-control {invalid.term ? "is-invalid" : "is-valid"}" id="term" min="1" bind:value={form.term} >
          <span class="input-group-text"><BilingualText key="term" /></span>
        </div>
        {#if invalid.term }
          <div class="text-danger">
            {message.term}
          </div>
        {/if}
      </div>
      <div class="mb-3">
        <label for="startDate" class="form-label"><BilingualText key="start_date" />&nbsp;<span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <input type="date" id="startDate" class="form-control {invalid.startDate ? "is-invalid" : "is-valid"}" bind:value={form.startDate} >
        {#if invalid.startDate }
          <div class="text-danger">
            {message.startDate}
          </div>
        {/if}
      </div>
      <div class="mb-3">
        <label for="endDate" class="form-label"><BilingualText key="end_date" />&nbsp;<span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <input type="date" id="endDate" class="form-control {invalid.endDate ? "is-invalid" : "is-valid"}" bind:value={form.endDate} >
        {#if invalid.endDate }
          <div class="text-danger">
            {message.endDate}
          </div>
        {/if}
      </div>
      <div class="mb-3">
        <label for="roundingMethod" class="form-label"><BilingualText key="rounding" /><span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <select id="roundingMethod" class="form-control"
          bind:value={form.roundingMethod}>
          {#each ROUNDING_METHOD as method}
          <option value={method[0]}>{method[1]}</option>
          {/each}
        </select>
        {#if invalid.roundingMethod }
          <div class="text-danger">
            {message.roundingMethod}
          </div>
        {/if}
      </div>
      <div class="mb-3">
        <label for="companyClass" class="form-label"><BilingualText key="company_class" />&nbsp;<span class="badge bg-danger"><BilingualText key="required" /></span></label>
        <select id="companyClass" class="form-control"
          bind:value={form.companyClass}>
          <option value={0}></option>
          <option value={1}><BilingualText key="corporation" /></option>
          <option value={2}><BilingualText key="sole_proprietor" /></option>
        </select>
        {#if invalid.companyClass }
          <div class="text-danger">
            {message.companyClass}
          </div>
        {/if}
      </div>
      <div class="d-flex justify-content-center">
        {#if loding }
          <button type="button" class="btn btn-primary col-lg-8 col-12" disabled>
            <span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span><BilingualText key="registering" /></button>
        {:else }
          <button type="button" class="btn btn-primary col-lg-8 col-12" on:click={submit}><BilingualText key="register" /></button>
        {/if}
      </div>
    </form>
  </div>
</div>
<div class="text-center text-light-emphasis">version {version}</div>
<script>
  import axios from 'axios';
  import {onMount} from 'svelte';
  import {get} from 'svelte/store';
  import {ROUNDING_METHOD} from '../../../libs/utils.js';
  import {bi} from '../../javascripts/bilingual.js';
  import BilingualText from '../components/bilingual-text.svelte';

  let form = {};
  let invalid = {};
  let message = {};
  let serverError = "";
  let loding = false;
  let version = "";

  onMount(async () => {
    const year = new Date().getFullYear();
    form = {
      term: 1,
      year: year,
      startDate: `${year}-04-01`,
      endDate: `${year + 1}-03-31`,
      roundingMethod: 2,
      companyClass: 0
    };
    invalid ={
      term: false,
      year: false,
      startDate: false,
      endDate: false,
      roundingMethod: false,
      companyClass: false
    };
    const result = await axios.get('/api/version');
    if ( result.data ){
      version = result.data.version;
    }
  })
  const isYearValid = () => {
    invalid.year = false;
    message.year = "";
    if ( form.year === null){
      invalid.year = true;
      message.year = get(bi)('fy_required_msg')
      return false;
    }
    const minYear = new Date().getFullYear() - 5;
    if ( form.year < minYear ){
      invalid.year = true;
      message.year = get(bi)('fy_invalid_msg')
      return false;
    }
    const nowYear = new Date().getFullYear();
    if ( form.year > nowYear ){
      invalid.year = true;
      message.year = get(bi)('fy_invalid_msg')
      return false;
    }
    return true;
  }
  const isTermValid = () => {
    invalid.term = false;
    message.term = "";
    if (form.term === null ){
      invalid.term = true;
      message.term = get(bi)('term_required_msg')
      return false;
    }
    if (form.term < 1 ){
      invalid.term = true;
      message.term = get(bi)('term_invalid_msg')
      return false;
    }
    return true;
  }
  const isStartDateValid = () => {
    invalid.startDate = false;
    message.startDate = "";
    if ( form.startDate.length === 0 ){
      invalid.startDate = true;
      message.startDate = get(bi)('start_date_required_msg')
      return false;
    }
    if ( isYearValid() && new Date(form.startDate).getFullYear() !== form.year ){
      invalid.startDate = true;
      message.startDate = get(bi)('start_date_year_mismatch')
      return false;
    }
    return true;
  }
  const isEndDateValid = () => {
    invalid.endDate = false;
    message.endDate = "";
    if ( form.endDate.length === 0 ){
      invalid.endDate = true;
      message.endDate = get(bi)('end_date_required_msg')
      return false;
    }
    if ( isStartDateValid() && new Date(form.startDate) > new Date(form.endDate)){
      invalid.endDate = true;
      message.endDate = get(bi)('end_date_past_msg')
      return false;
    }
    return true;
  }
  const isCompanyValid = () => {
    invalid.companyClass = false;
    message.companyClass = "";
    if  ( form.companyClass == 0 ) {
      invalid.companyClass = true;
      message.companyClass = get(bi)('company_class_required')
      return false;
    }
    return  true;
  }
  const isFormDataValid = () =>{
    console.log(form);
    let count = 0;
    if ( !isYearValid() ){
      count++;
    }
    if ( !isTermValid() ){
      count++;
    }
    if ( !isStartDateValid() ){
      count++;
    }
    if ( !isEndDateValid() ){
      count++;
    }
    if ( !isCompanyValid() )  {
      count++;
    }
    return count > 0 ? false : true;
  }
  const submit = async () =>{
    if ( !isFormDataValid() ){
      return ;
    }
    try{
      loding = true;
      let result = await axios.post(`/api/setup`, form);
      loding = false;
      if (result.data.code === -99){
        serverError = get(bi)('setup_error_cancelled');
      }else{
        window.location.href = '/home';
      }
    }catch(e){
      loding = false;
      serverError = e.message;
      console.log(e);
    }
  }
</script>
