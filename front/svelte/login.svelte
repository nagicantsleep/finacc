{#if ( status.current === 'login') }
<Login
  bind:current={status.current}></Login>
{:else if ( status.current === 'signup' ) }
<SignUp
  bind:current={status.current}></SignUp>
{:else if ( status.current === 'tenant-select' ) }
<TenantSelect></TenantSelect>
{/if}

<script>
import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';
import axios from 'axios';

import Login from './login/login.svelte';
import SignUp from './login/signup.svelte';
import TenantSelect from './login/tenant-select.svelte';

export let term;

let status = {
  current: 'login'
}
let reply;
onMount(() => {
  console.log('index onMount');
  status.pathname = location.pathname;
  // Route to tenant-select if user navigates directly to that path
  if (location.pathname === '/login/select-tenant') {
    status.current = 'tenant-select';
  }
  axios.get('/api/user').then((res) => {
    status.user = res.data.user;
  });
})

beforeUpdate(() => {
  let args = location.pathname.split('/');
  console.log('index beforeUpdate', args);
  // Handle /login/select-tenant path
  if (location.pathname === '/login/select-tenant') {
    status.current = 'tenant-select';
  } else {
    status.current = args[1];
  }
  status = status;
})

</script>